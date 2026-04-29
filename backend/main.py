from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ocr import extract_detections
from parser import parse_line_items

app = FastAPI(title="Evenly OCR API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/ocr")
async def ocr_receipt(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file received.")

    try:
        detections = extract_detections(image_bytes)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"OCR failed: {exc}")

    items = parse_line_items(detections)
    raw_lines = [d["text"] for d in detections]

    return {"raw_lines": raw_lines, "items": items}
