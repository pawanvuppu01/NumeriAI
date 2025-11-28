# NumeriAI - Full-Stack LLM Web App

A complete production-ready full-stack AI application demonstrating a minimal transformer-based LLM for mathematical Q&A tasks.

##  Project Overview

NumeriAI is a full-stack implementation featuring:
- **Backend**: FastAPI + PyTorch transformer model
- **Frontend**: React + Vite + Tailwind CSS
- **Training**: PyTorch-based model trainer
- **Deployment**: Docker support for both backend and frontend

##  Project Structure

```
├── backend/                      # FastAPI backend with PyTorch
│   ├── main.py                   # FastAPI application
│   ├── inference.py              # Model inference logic
│   ├── model.py                  # TinyTransformer model
│   ├── tokenizer.py              # Character-level tokenizer
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile                # Docker configuration
│   └── checkpoints/
│       └── model.pt              # Trained model weights
│
├── frontend/                     # React frontend
│   ├── index.html                # HTML entry point
│   ├── package.json              # Node dependencies
│   ├── vite.config.js            # Vite configuration
│   ├── tailwind.config.js        # Tailwind configuration
│   ├── postcss.config.js         # PostCSS configuration
│   ├── Dockerfile                # Docker configuration
│   └── src/
│       ├── App.jsx               # Main React component
│       ├── main.jsx              # React entry point
│       ├── api.js                # Backend API client
│       └── index.css             # Tailwind styles
│
└── training/                     # Model training
    ├── train.py                  # Training script
    ├── model.py                  # Model definition
    ├── tokenizer.py              # Tokenizer definition
    └── dataset.txt               # Training dataset
```

##  Quick Start

### 1. Train the Model

```bash
cd training
python train.py
```

This will generate `../backend/checkpoints/model.pt`.

### 2. Run Backend Server

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`.

### 3. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

##  Docker Deployment

### Backend Docker

```bash
cd backend
docker build -t numeriai-backend .
docker run -p 8000:8000 numeriai-backend
```

### Frontend Docker

```bash
cd frontend
docker build -t numeriai-frontend .
docker run -p 80:80 numeriai-frontend
```

##  Technology Stack

### Backend
- **Framework**: FastAPI
- **Server**: Uvicorn
- **ML**: PyTorch
- **Python**: 3.9+

### Frontend
- **Library**: React 18.2.0
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Node**: 18+

### Training
- **Framework**: PyTorch
- **Model**: Tiny Transformer (32 embedding size, 2 heads, 2 layers)
- **Tokenizer**: Character-level tokenizer

##  Model Architecture

The TinyTransformer model uses:
- **Embedding Size**: 32
- **Attention Heads**: 2
- **Hidden Dimension**: 64
- **Layers**: 2
- **Max Sequence Length**: 32
- **Vocabulary**: Digits (0-9) + Math operators (+-*/) + Space

##  Usage

1. Enter a math problem in the frontend (e.g., "2+3")
2. Click "Send"
3. The model generates the answer

### Example Queries
- `2+3` → `5`
- `7-2` → `5`
- `4*2` → `8`
- `9/3` → `3`

##  API Endpoints

### POST /generate

Request:
```json
{
  "prompt": "2+3"
}
```

Response:
```json
{
  "answer": "5"
}
```

##  Development

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev    # Development server
npm run build  # Production build
```

### Training
```bash
cd training
python train.py
```

##  Dependencies

### Backend (`backend/requirements.txt`)
- fastapi
- uvicorn
- torch

### Frontend (`frontend/package.json`)
- react
- react-dom
- vite
- tailwindcss
- postcss
- autoprefixer

##  Security Notes

- CORS is enabled for all origins in development (update in production)
- Model runs on CPU only (suitable for development/testing)

##  Production Deployment

For production deployment:
1. Update CORS settings in `backend/main.py`
2. Add environment variables for configuration
3. Use a production-grade ASGI server (e.g., Gunicorn + Uvicorn)
4. Deploy frontend behind Nginx or CDN
5. Use proper model versioning and checkpointing

##  License

MIT License - See LICENSE file for details

##  Author

Pawan Vuppu (@pawanvuppu01)

##  Contributing

Feel free to fork, submit issues, and create pull requests!

---

**Last Updated**: November 28, 2025
