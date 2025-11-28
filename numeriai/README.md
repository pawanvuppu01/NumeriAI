
# NumeriAI

NumeriAI is a full-stack AI web app that demonstrates a minimal transformer-based LLM for math Q&A.

## Features

- **Backend:** FastAPI + PyTorch, loads a tiny transformer model, exposes `/generate` endpoint.
- **Frontend:** React + Vite + Tailwind, simple UI for prompt/response.
- **Training:** PyTorch script to train a tiny transformer on simple math Q/A pairs.

## Quickstart

### 1. Train the Model
```bash
cd numeriai/training
python train.py
```

### 2. Start Backend
```bash
cd numeriai/backend
uvicorn main:app --reload
```

### 3. Start Frontend
```bash
cd numeriai/frontend
npm install
npm run dev
```

### 4. Usage

- Enter a math question (e.g., `2+3`) in the frontend and get the answer from the backend.

## Docker

- Backend: See `backend/Dockerfile`
- Frontend: See `frontend/Dockerfile`
