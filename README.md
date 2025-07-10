# Evenly
Making the world a better place by decentralizing fiscal responsibility through serverless equity reconciliation and ML-enhanced friendship preservation.

## Frontend Setup
_Prereqs include having node installed and either XCode or Android Studio for the simulator_

1. Clone the repo
2. CD into `frontend/evenly/`
3. Run `npm install`
4. Run `npx expo` to get it up and running, follow the terminal prompts

**Before starting development it's advised to run** `npm run reset-project` ***I just left the starter code as is for learning purposes.**

---

## Backend Setup
1. Clone the repo
2. CD into `backend/`
3. Run `npm install`
4. Run `npm run dev` to start the server

**Server will be running on `localhost:3000`, you can interact with it through any API service like Postman.**

---

## OCR Microservice

#### Build:
In `ocr-service` run:

```bash
docker build -t ocr-service .
```

#### Run:

In `ocr-service` run:

```bash
docker run -p 8080:8080 ocr-service
```