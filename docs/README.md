# Graviton — AI Chat Application

A self-hosted AI chat interface powered by local LLMs via Ollama. Built with Next.js, FastAPI, and PostgreSQL.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, Tailwind CSS, Zustand, shadcn/ui |
| Backend | FastAPI, SQLAlchemy, Python 3.11+ |
| Database | PostgreSQL 15+ |
| AI Engine | Ollama (local LLM runner) |

---

## Prerequisites

Install all of these before starting:

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 15+](https://www.postgresql.org/download/)
- [Ollama](https://ollama.com/download)

---

## Setup

### 1. Clone and open the project

```bash
git clone <repo-url>
cd graviton
```

---

### 2. Database — Create the PostgreSQL database

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql:
CREATE DATABASE graviton;
\q
```

---

### 3. Backend

```bash
cd backend
```

**Create a virtual environment:**

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

**Install dependencies:**

```bash
pip install -r requirements.txt
```

**Create the `.env` file:**

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/graviton
OLLAMA_URL=http://localhost:11434/api
FRONTEND_URL=http://localhost:3000
```

> Change `postgres:postgres` to your actual PostgreSQL username and password.

**Run the backend:**

```bash
# Option A — uvicorn directly (recommended)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Option B — via Python
python main.py
```

> The API will be available at `http://localhost:8000`
> Interactive API docs: `http://localhost:8000/docs`

---

### 4. Frontend

```bash
cd frontend
```

**Install dependencies:**

```bash
npm install
```

**Run the development server:**

```bash
npm run dev
```

> The app will be available at `http://localhost:3000`

**Build for production:**

```bash
npm run build
npm start
```

---

### 5. Ollama — Pull your first model

Make sure the Ollama desktop app is running, then pull a model:

```bash
ollama pull llama3.2
```

Then in the app: **Settings → Models → Sync** to register it.

---

## Running All Services

Open three terminals:

```bash
# Terminal 1 — Ollama (if not running as a service)
ollama serve

# Terminal 2 — Backend
cd backend
.\venv\Scripts\activate          # Windows
source venv/bin/activate         # macOS / Linux
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3 — Frontend
cd frontend
npm run dev
```

Then open `http://localhost:3000`.

---

## Command Reference

### Backend

| Task | Command |
|---|---|
| Create virtualenv | `python -m venv venv` |
| Activate (Windows) | `.\venv\Scripts\activate` |
| Activate (macOS/Linux) | `source venv/bin/activate` |
| Install dependencies | `pip install -r requirements.txt` |
| Run (uvicorn, recommended) | `uvicorn main:app --reload --host 0.0.0.0 --port 8000` |
| Run (production) | `uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4` |
| Run (via Python) | `python main.py` |
| API docs | Open `http://localhost:8000/docs` |

### Frontend

| Task | Command |
|---|---|
| Install dependencies | `npm install` |
| Run dev server | `npm run dev` |
| Type check | `npx tsc --noEmit` |
| Build production | `npm run build` |
| Run production build | `npm start` |

### Ollama

| Task | Command |
|---|---|
| Start Ollama server | `ollama serve` |
| Pull a model | `ollama pull llama3.2` |
| List installed models | `ollama list` |
| Remove a model | `ollama rm llama3:latest` |
| Run a model in terminal | `ollama run llama3.2` |

---

## Admin Panel & PIN

The **Database** and **System Admin** sections inside Settings are PIN-protected.

**Default PIN: `1234`**

To access:
1. Open **Settings** (gear icon, top right)
2. Click **Database** or **System Admin** in the left nav
3. Enter `1234` in the PIN field
4. Click **Unlock Panel**

> Once unlocked, the session stays unlocked until you close the Settings dialog.

### Change the default PIN

The PIN is currently hardcoded in `frontend/components/chat/settings-dialog.tsx`:

```typescript
// Line ~380 in settings-dialog.tsx
if (pinInput === '1234' || localStorage.getItem('admin-unlocked') === 'true') {
```

Change `'1234'` to your preferred PIN. A proper PIN management UI (change PIN form) is in the **System Admin** tab once unlocked.

---

## Environment Variables

### `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/graviton` | PostgreSQL connection string |
| `OLLAMA_URL` | `http://localhost:11434/api` | Ollama API base URL |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/settings` | Load app settings |
| `PUT` | `/api/settings` | Save app settings |
| `GET` | `/api/registered-models` | List registered models |
| `POST` | `/api/registered-models` | Register a model |
| `PUT` | `/api/registered-models/{id}` | Update model name / toggle active |
| `DELETE` | `/api/registered-models/{id}` | Remove model from registry |
| `POST` | `/api/registered-models/sync` | Auto-import installed Ollama models |
| `GET` | `/api/models` | Raw Ollama model list |
| `POST` | `/api/models/pull` | Download a model via Ollama |
| `DELETE` | `/api/models/{name}` | Delete a model from Ollama |
| `GET` | `/api/chats` | List all chats |
| `POST` | `/api/chats` | Create a chat |
| `PUT` | `/api/chats/{id}` | Rename a chat |
| `DELETE` | `/api/chats/{id}` | Delete a chat |
| `GET` | `/api/chats/{id}/messages` | Get messages for a chat |
| `POST` | `/api/chat` | Send a message (streaming) |
| `POST` | `/api/upload` | Upload a file attachment |
| `GET` | `/api/admin/status` | System status (Ollama + DB) |
| `POST` | `/api/admin/db-test` | Test a DB connection URL |

---

## Troubleshooting

**Backend won't start**
- Check PostgreSQL is running: `pg_isready -h localhost`
- Verify `DATABASE_URL` in `backend/.env` has the correct credentials
- Ensure the `graviton` database exists: `psql -U postgres -c "\l"`

**Ollama not connecting**
- Make sure Ollama is running: `ollama serve` or open the Ollama desktop app
- Default port is `11434` — verify with `curl http://localhost:11434/api/tags`

**No models in dropdown**
- Go to **Settings → Models → Sync** after pulling a model
- Or pull a model first: `ollama pull llama3.2`

**CORS errors in browser**
- Verify `FRONTEND_URL=http://localhost:3000` in `backend/.env`
- Restart the backend after changing `.env`

**Frontend can't reach backend**
- Confirm backend is running on port `8000`: `curl http://localhost:8000/api/health`
- Check `frontend/app/api/[[...path]]/route.ts` — it proxies all `/api/*` calls to `localhost:8000`
