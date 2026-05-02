# Graviton AI Chatbot

Graviton is a premium, high-performance AI chatbot interface powered by local LLMs via Ollama. It features a modern, high-density UI inspired by Linear and neural engineering aesthetics, integrated with a robust FastAPI backend and PostgreSQL for chat history persistence.

---

## 🏗️ Architecture

- **Frontend**: Next.js 15+ (App Router), Tailwind CSS, Lucide React, Framer Motion.
- **Backend**: FastAPI (Python 3.10+), SQLAlchemy (ORM), PostgreSQL.
- **AI Engine**: Ollama (Local LLM Orchestration).

---

## 📋 Prerequisites

Ensure you have the following installed on your system:

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Ollama](https://ollama.com/)

---

## 🚀 Getting Started

### 1. Setup the Backend

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```

2.  **Create a virtual environment** (recommended):
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # macOS/Linux:
    source venv/bin/activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables**:
    Create a `.env` file in the `backend/` folder (or edit the existing one):
    ```env
    DATABASE_URL=postgresql://user:password@localhost:5432/graviton
    OLLAMA_URL=http://localhost:11434/api
    PORT=8000
    FRONTEND_URL=http://localhost:3000
    ```

5.  **Run the Backend**:
    ```bash
    python main.py
    ```
    The API will be available at `http://localhost:8000`.

---

### 2. Setup the Frontend

1.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Run the Development Server**:
    ```bash
    npm run dev
    # or
    pnpm dev
    ```
    The application will be available at `http://localhost:3000`.

---

## 🛠️ Commands Summary

| Component | Task | Command |
| :--- | :--- | :--- |
| **Backend** | Install Deps | `pip install -r requirements.txt` |
| **Backend** | Run App | `python main.py` |
| **Frontend** | Install Deps | `npm install` |
| **Frontend** | Run App | `npm run dev` |
| **Database** | Migration | `alembic upgrade head` (if applicable) |

---

## 🧪 Features

- **Local LLM Integration**: Connects directly to Ollama for privacy and speed.
- **Chat Persistence**: Full history stored in PostgreSQL.
- **Model Management**: Pull, list, and delete Ollama models directly from the UI.
- **Premium UI**: Dark-mode first, glassmorphic design with high-density instrumentation.
- **Streaming Responses**: Real-time token streaming for a natural chat experience.

---

## 🛡️ Troubleshooting

- **Database Connection**: Ensure PostgreSQL is running and the `DATABASE_URL` in `backend/.env` matches your credentials.
- **Ollama Status**: Make sure the Ollama desktop app or service is running before starting the backend.
- **CORS Issues**: If the frontend cannot communicate with the backend, verify `FRONTEND_URL` in `backend/.env` is set to `http://localhost:3000`.
