import io
import os
import re
import tempfile
from PIL import Image

# PaddleOCR is imported lazily in ocr_process() to avoid slow startup when only hitting test-api.

# Geometry parser constants
PRICE_RE = re.compile(r'^\$?-?(\d+\.\d{1,2})$')  # optional $ or -, then digits.digits
REJECT_ROW_KEYWORDS = re.compile(
    r'\b(subtotal|tax|total|tip|change|cash|visa|mastercard|amex|card|type|entry|'
    r'ref|status|phone|www|receipt|table|server|guests|date|time|address|thank|please)\b',
    re.I
)
DATE_TIME_RE = re.compile(r'^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}|^\d{1,2}:\d{2}|^\d{4,}$')  # date, time, or long number (order #)


def _box_center(box):
    """Return (center_x, center_y) for a 4-point box [[x,y],...]."""
    if not box or len(box) < 4:
        return (0, 0)
    xs = [p[0] for p in box]
    ys = [p[1] for p in box]
    return (sum(xs) / 4, sum(ys) / 4)


def _box_height(box):
    if not box or len(box) < 4:
        return 0
    ys = [p[1] for p in box]
    return max(ys) - min(ys)


def _parse_receipt_geometry(ocr_result) -> tuple:
    """
    Geometry-aware parser using PaddleOCR boxes.
    Returns (items, summary) same shape as _parse_receipt_text.
    """
    if not ocr_result:
        return [], []
    # Flatten to list of (box, text, conf). Each line is [box, (text, conf)] or list of same.
    tokens = []
    page = ocr_result[0] if isinstance(ocr_result[0], list) and ocr_result else ocr_result
    for line in page:
        if not line or len(line) < 2:
            continue
        # Single detection has line[0] = box (length 4); list of detections has line[0] = [box, (text,conf)] (length 2)
        detections = [line] if (isinstance(line[0], (list, tuple)) and len(line[0]) == 4) else line
        for item in detections:
            if not item or len(item) < 2:
                continue
            box = item[0]
            part = item[1]
            text = (part[0] if isinstance(part, (list, tuple)) else str(part)).strip()
            if not text:
                continue
            conf = part[1] if isinstance(part, (list, tuple)) and len(part) > 1 else 0
            tokens.append((box, text, conf))

    if not tokens:
        return [], []

    # Sort by y then x
    def sort_key(t):
        box, text, _ = t
        cx, cy = _box_center(box)
        return (cy, cx)

    tokens.sort(key=sort_key)

    # Cluster into rows by y (use median box height as threshold)
    heights = [_box_height(box) for box, _, _ in tokens]
    median_h = sorted(heights)[len(heights) // 2] if heights else 20
    y_threshold = max(median_h * 0.5, 5)

    rows = []
    current_row = []
    current_y = None

    for t in tokens:
        box, text, conf = t
        cy = _box_center(box)[1]
        if current_y is None:
            current_row = [t]
            current_y = cy
            continue
        if abs(cy - current_y) <= y_threshold:
            current_row.append(t)
            current_y = (current_y * (len(current_row) - 1) + cy) / len(current_row)
        else:
            if current_row:
                rows.append(current_row)
            current_row = [t]
            current_y = cy
    if current_row:
        rows.append(current_row)

    # Build logical rows: (description_tokens, price_token_text) or (tokens, None) for no price
    logical_rows = []
    i = 0
    while i < len(rows):
        row_tokens = rows[i]  # list of (box, text, conf)
        texts = [t[1] for t in row_tokens]
        # Rightmost price-like token
        price_text = None
        price_idx = -1
        for idx in range(len(row_tokens) - 1, -1, -1):
            text = row_tokens[idx][1]
            m = PRICE_RE.match(text.replace(',', '').strip())
            if m:
                price_text = text.replace('$', '').replace(',', '').strip()
                if price_text.startswith('-'):
                    price_text = price_text
                price_idx = idx
                break
        if price_text is not None:
            desc_tokens = [t for j, t in enumerate(row_tokens) if j != price_idx]
            logical_rows.append((desc_tokens, price_text, row_tokens))
            i += 1
            continue
        # No price in this row: check for continuation (next row has price)
        if i + 1 < len(rows):
            next_tokens = rows[i + 1]
            next_texts = [t[1] for t in next_tokens]
            next_price = None
            next_price_idx = -1
            for idx in range(len(next_tokens) - 1, -1, -1):
                m = PRICE_RE.match(next_tokens[idx][1].replace(',', '').strip())
                if m:
                    next_price = next_tokens[idx][1].replace('$', '').replace(',', '').strip()
                    next_price_idx = idx
                    break
            if next_price is not None and next_price_idx >= 0:
                desc_this = ' '.join(texts)
                desc_next = ' '.join(t[1] for j, t in enumerate(next_tokens) if j != next_price_idx)
                merged_desc = (desc_this + ' ' + desc_next).strip() if desc_next else desc_this
                logical_rows.append(([(None, merged_desc, 0)], next_price, next_tokens))
                i += 2
                continue
        logical_rows.append((row_tokens, None, row_tokens))
        i += 1

    items = []
    summary = []

    for desc_tokens, price_text, _ in logical_rows:
        if price_text is None:
            # Try to capture subtotal/tax/total from non-item rows
            full = ' '.join(t[1] for t in desc_tokens).strip()
            tm = re.search(r'(subtotal|tax|total)\s*:?\s*\$?(-?\d+\.\d{1,2})', full, re.I)
            if tm:
                key = tm.group(1).lower()
                val = float(tm.group(2))
                if key == 'subtotal':
                    summary.append({'subtotal': val})
                elif key == 'tax':
                    summary.append({'tax': val})
                elif key == 'total':
                    summary.append({'total': val})
            continue

        try:
            price = float(price_text.replace('$', '').replace(',', '').strip())
        except ValueError:
            continue
        description = ' '.join(t[1] for t in desc_tokens).strip()
        if not description:
            continue
        # Reject non-item rows
        if REJECT_ROW_KEYWORDS.search(description):
            continue
        if REJECT_ROW_KEYWORDS.search(price_text):
            continue
        # Reject date/time/order-number only
        if DATE_TIME_RE.match(description.strip()) and len(description) < 25:
            continue
        # Optional: allow negative (discounts)
        # if price < 0: continue  # uncomment to reject discounts

        # Quantity: leftmost token if small integer (only when multiple tokens so description stays non-empty)
        quantity = 1
        if len(desc_tokens) > 1:
            first_text = desc_tokens[0][1].strip()
            if re.match(r'^\d{1,2}$', first_text):
                q = int(first_text)
                if 1 <= q <= 99:
                    rest = ' '.join(t[1] for t in desc_tokens[1:]).strip()
                    if rest:
                        quantity = q
                        description = rest
        description = re.sub(r'\s+', ' ', description).strip()
        if quantity > 1:
            name = f'{quantity}x {description}'
        else:
            name = description
        if not name:
            continue
        items.append({'name': name, 'price': price, 'quantity': quantity})

    return items, summary


def dummy_process():
    return {
        'status': 'success',
        'message': 'Dummy response',
        'items': [
            {'name': 'Item 1', 'price': 10.0, 'quantity': 2},
            {'name': 'Item 2', 'price': 20.0, 'quantity': 1},
            {'name': 'Item 3', 'price': 15.0, 'quantity': 3},
            {'subtotal': 45.0},
            {'tax': 4.5},
            {'total': 49.5}
        ]
    }


def _parse_receipt_text(text: str):
    """Extract line items and summary from receipt OCR text (from PaddleOCR or any raw text)."""
    items = []
    summary = []

    skip_pattern = re.compile(
        r'^(SUBTOTAL|TAX|TOTAL|CARD|TYPE|ENTRY|TIME|REF|STATUS|PHONE|WWW|'
        r'RECEIPT|TABLE|SERVER|GUESTS|DATE|ADDRESS|TIP|THANK|PLEASE)\b',
        re.I
    )
    item_pattern = re.compile(
        r'^\s*(?:(\d+)\s*(?:[xX]\s+)?)?(.+?)\s+\$?(\d+\.\d{1,2})\s*$'
    )
    total_pattern = re.compile(
        r'^\s*(SUBTOTAL|TAX|TOTAL)\s*:?\s*\$?(\d+\.\d{1,2})\s*$',
        re.I
    )

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        m = item_pattern.match(line)
        if m:
            qty = int(m.group(1)) if m.group(1) else 1
            name = re.sub(r'\s+', ' ', m.group(2).strip())
            price = float(m.group(3))
            if name and not skip_pattern.match(name):
                items.append({
                    'name': f'{qty}x {name}' if qty > 1 else name,
                    'price': price,
                    'quantity': qty,
                })
            continue
        tm = total_pattern.match(line)
        if tm:
            key = tm.group(1).lower()
            val = float(tm.group(2))
            if key == 'subtotal':
                summary.append({'subtotal': val})
            elif key == 'tax':
                summary.append({'tax': val})
            elif key == 'total':
                summary.append({'total': val})

    return items, summary


def _paddle_ocr_raw(data: bytes):
    """Run PaddleOCR on image bytes; return raw result (list of lines, each line list of [box, (text, conf)])."""
    from paddleocr import PaddleOCR

    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
        f.write(data)
        path = f.name
    try:
        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        if hasattr(ocr, 'ocr'):
            result = ocr.ocr(path, cls=True)
        else:
            result = ocr.predict(path)
        return result
    finally:
        try:
            os.unlink(path)
        except Exception:
            pass


def _raw_result_to_text(ocr_result) -> str:
    """Build full text from raw PaddleOCR result (one line per detected line) for 'data' field."""
    if not ocr_result:
        return ''
    page = ocr_result[0] if isinstance(ocr_result[0], list) and ocr_result else ocr_result
    lines = []
    for line in page:
        if not line or len(line) < 2:
            continue
        detections = [line] if (isinstance(line[0], (list, tuple)) and len(line[0]) == 4) else line
        parts = []
        for item in detections:
            if item and len(item) >= 2:
                part = item[1]
                text = part[0] if isinstance(part, (list, tuple)) else str(part)
                parts.append(text)
        if parts:
            lines.append(' '.join(parts))
    return '\n'.join(lines)


def ocr_process(filename: str, data: bytes):
    ocr_result = _paddle_ocr_raw(data)
    full_text = _raw_result_to_text(ocr_result)
    items, summary = _parse_receipt_geometry(ocr_result)
    if not items and full_text:
        items, summary = _parse_receipt_text(full_text)
    combined = list(items)
    combined.extend(summary)
    return {
        'status': 'success',
        'message': f'Processed file: {filename}',
        'data': full_text,
        'items': combined,
    }
