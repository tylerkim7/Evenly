# Evenly

Split any restaurant bill, fairly. Photograph a receipt, review the extracted line items, assign each item to the people who ordered it, and get an instant breakdown of who owes what.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile frontend | React Native + Expo Router + TypeScript |
| OCR backend | Python FastAPI + PaddleOCR |
| State management | React Context + useReducer (no database) |
| Image upload | `expo-image-picker` → `multipart/form-data` POST |

---

## Prerequisites

- **Node.js** 18+ and npm
- **Expo Go** app installed on your iPhone (from the App Store)
- **Python 3.9+** and pip
- Both your Mac/PC and your iPhone on the **same Wi-Fi network**

---

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The first startup downloads PaddleOCR model weights (~100 MB) — this only happens once.

Verify it's running by visiting `http://localhost:8000` in your browser. You should see `{"status":"ok"}`.

---

## Frontend Setup

1. **Find your LAN IP address**

   On Mac: `ifconfig | grep "inet " | grep -v 127`
   On Windows: `ipconfig` and look for your Wi-Fi IPv4 address

2. **Update the backend URL** in `frontend/app/index.tsx`:

   ```ts
   const OCR_URL = 'http://<YOUR_LAN_IP>:8000/ocr';
   ```

3. **Install dependencies and start**

   ```bash
   cd frontend
   npm install
   npx expo start
   ```

4. Scan the QR code with the **Camera app** on your iPhone. Expo Go will open automatically.

---

## How to Use

1. **Home screen** — tap "Take Photo" to photograph a receipt, or "Choose from Library" to pick one.
2. **Review screen** — check the extracted items. Tap any item to edit its name or price. Tap "Delete" to remove a misread item.
3. **People screen** — type each person's name and tap "Add". Then tap the colored chips on each item to assign it to one or more people. Items assigned to multiple people are split equally.
4. **Summary screen** — see each person's total with an itemized breakdown. Tap "Start Over" to scan another receipt.

---

## Known Limitations

- Both devices must be on the same Wi-Fi network — the app talks to a local server, not the internet.
- OCR accuracy varies with receipt print quality, lighting, and angle. Review items carefully on the Review screen.
- No data persistence — closing the app resets everything.
- Tax and tip are intentionally excluded from OCR parsing; add them manually by editing an item on the Review screen if needed.

---

## Future Ideas

- Cloud OCR (Google Vision API or AWS Textract) for better accuracy and remote access
- Tip and tax splitting (percentage-based, split evenly, or assigned to all)
- Persistent history with AsyncStorage or a lightweight SQLite backend
- Sharing summaries via iMessage or a generated link
- Camera preview with crop/rotate before upload
