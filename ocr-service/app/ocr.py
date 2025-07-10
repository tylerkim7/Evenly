def dummy_process(filename: str):
    return {
        'status': 'success',
        'message': f'Received file: {filename}',
        'items': [
            {'name': 'Item 1', 'price': 10.0, 'quantity': 2},
            {'name': 'Item 2', 'price': 20.0, 'quantity': 1},
            {'name': 'Item 3', 'price': 15.0, 'quantity': 3},
            {'subtotal': 45.0},
            {'tax': 4.5},
            {'total': 49.5}
        ]
    }