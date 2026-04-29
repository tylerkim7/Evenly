from paddleocr import PaddleOCR
from PIL import Image, ImageEnhance, ImageFilter
import io
import os
import tempfile

_ocr = None


def get_ocr() -> PaddleOCR:
    global _ocr
    if _ocr is None:
        _ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
    return _ocr


def _preprocess(image: Image.Image) -> Image.Image:
    """Grayscale → boost contrast → sharpen → back to RGB for PaddleOCR."""
    image = image.convert("L")
    image = ImageEnhance.Contrast(image).enhance(1.8)
    image = image.filter(ImageFilter.SHARPEN)
    return image.convert("RGB")


def extract_detections(image_bytes: bytes) -> list[dict]:
    """
    Returns one dict per detected text region, sorted top-to-bottom then
    left-to-right. Each dict has: text, confidence, cx, cy, height.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = _preprocess(image)

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        image.save(tmp.name, format="JPEG", quality=95)
        tmp_path = tmp.name

    try:
        result = get_ocr().ocr(tmp_path, cls=True)
    finally:
        os.unlink(tmp_path)

    detections: list[dict] = []
    if result and result[0]:
        for det in result[0]:
            bbox, (text, conf) = det
            xs = [p[0] for p in bbox]
            ys = [p[1] for p in bbox]
            detections.append(
                {
                    "text": text.strip(),
                    "confidence": float(conf),
                    "cx": sum(xs) / 4,
                    "cy": sum(ys) / 4,
                    "height": max(ys) - min(ys),
                }
            )

    detections.sort(key=lambda d: (d["cy"], d["cx"]))
    return detections
