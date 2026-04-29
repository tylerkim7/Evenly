import re
import statistics

SKIP_RE = re.compile(
    r"\b(subtotal|sub[\s\-]?total|total|tax|tip|gratuity|balance|"
    r"amount due|change|cash|credit|debit|visa|mastercard|amex|discover|"
    r"payment|thank|receipt|order|table|server|cashier|guest|check|"
    r"date|time|phone|address|welcome|visit)\b",
    re.IGNORECASE,
)

PRICE_RE = re.compile(r"\$?\s*(\d{1,3}(?:,\d{3})*\.\d{2})")
CLEAN_RE = re.compile(r"[^a-zA-Z0-9 &'\-/]")
LEADING_QTY_RE = re.compile(r"^\d{1,3}[xX\s]\s*(?=[a-zA-Z])")
DIGITS_ONLY_RE = re.compile(r"^\d+$")


def _clean(text: str) -> str:
    return CLEAN_RE.sub("", text).strip()


def _strip_qty(name: str) -> str:
    return LEADING_QTY_RE.sub("", name).strip()


def _is_valid_name(name: str) -> bool:
    return bool(name) and not DIGITS_ONLY_RE.match(name)


def _group_into_rows(detections: list[dict]) -> list[list[dict]]:
    """
    Groups detections into rows using vertical proximity.
    Threshold is 70% of the median text height — tight enough to separate
    adjacent receipt lines, loose enough to tolerate slight skew.
    """
    if not detections:
        return []

    median_height = statistics.median(d["height"] for d in detections)
    threshold = median_height * 0.7

    rows: list[list[dict]] = [[detections[0]]]
    for det in detections[1:]:
        if det["cy"] - rows[-1][-1]["cy"] <= threshold:
            rows[-1].append(det)
        else:
            rows.append([det])

    for row in rows:
        row.sort(key=lambda d: d["cx"])

    return rows


def parse_line_items(detections: list[dict]) -> list[dict]:
    rows = _group_into_rows(detections)
    items: list[dict] = []
    item_id = 0

    for row in rows:
        full_row_text = " ".join(d["text"] for d in row)
        if SKIP_RE.search(full_row_text):
            continue

        # Find the rightmost detection that contains a valid price
        price: float | None = None
        price_det_idx: int | None = None
        price_match: re.Match | None = None

        for i in range(len(row) - 1, -1, -1):
            m = PRICE_RE.search(row[i]["text"])
            if m:
                try:
                    p = float(m.group(1).replace(",", ""))
                except ValueError:
                    continue
                if 0 < p <= 999:
                    price = p
                    price_det_idx = i
                    price_match = m
                    break

        if price is None or price_det_idx is None or price_match is None:
            continue

        # Name = all detections to the left of the price column …
        name_parts = [row[i]["text"] for i in range(price_det_idx)]

        # … plus any text inside the price detection that precedes the price itself
        prefix = row[price_det_idx]["text"][: price_match.start()].strip()
        if prefix:
            name_parts.append(prefix)

        name = _strip_qty(_clean(" ".join(name_parts)))

        if not _is_valid_name(name):
            continue

        items.append({"id": str(item_id), "name": name, "price": price})
        item_id += 1

    return items
