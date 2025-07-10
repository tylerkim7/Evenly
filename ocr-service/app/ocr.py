import io
import numpy as np
import pytesseract
from PIL import Image

def dummy_process():
    return {
        'status': 'success',
        'message': f'Dummy response',
        'items': [
            {'name': 'Item 1', 'price': 10.0, 'quantity': 2},
            {'name': 'Item 2', 'price': 20.0, 'quantity': 1},
            {'name': 'Item 3', 'price': 15.0, 'quantity': 3},
            {'subtotal': 45.0},
            {'tax': 4.5},
            {'total': 49.5}
        ]
    }


def ocr_process(filename: str, data: bytes):
    img = Image.open(io.BytesIO(data))
    out = pytesseract.image_to_string(img)

    return {
        'status': 'success',
        'message': f'Processed file: {filename}',
        'data': out
    }
    