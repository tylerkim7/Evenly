from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from app.ocr import dummy_process
import logging

# logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logging.basicConfig(level=logging.INFO, format='\033[33m%(levelname)s:\033[0m\t  %(name)s: %(message)s')

app = FastAPI()
logger = logging.getLogger(__name__)

@app.post("/parse-receipt")
async def ocr_endpoint(file: UploadFile = File(...)):
    """
    Endpoint to handle OCR processing of uploaded files.
    """
    try:
        # Save the uploaded file temporarily
        contents = await file.read()
        file_size = len(contents)

        logger.info(f"Received file: {file.filename} ({file.content_type}, {file_size} bytes)")

        return JSONResponse(content=dummy_process(file.filename))
    
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)