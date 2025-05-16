# AI Chat Application

This is a chat application with a FastAPI backend and React frontend using ChatUI and Ant Design.

## Backend Setup

1. Create and activate a virtual environment:
```bash
cd backend
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Unix or MacOS
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the backend server:
```bash
python main.py
```

The backend server will run on http://localhost:8000

## Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:5173

## Features

- Real-time chat interface using ChatUI
- Modern UI with Ant Design components
- FastAPI backend with async support
- CORS enabled for local development
- TypeScript support for better development experience

## API Endpoints

- POST /api/chat
  - Request body: `{ "message": "your message" }`
  - Response: `{ "response": "AI response" }` 