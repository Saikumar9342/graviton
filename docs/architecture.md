# Graviton — Complete Architecture & End-to-End Flow

> **Audience:** Engineering managers, developers, and AI systems onboarding to the codebase.  
> **Last updated:** May 2026

---

## 1. What is Graviton?

Graviton is a **self-hosted AI chat platform** that acts as a unified front-end for multiple LLM providers. Instead of switching between different UIs for different models, users get one polished interface that routes to:

- **Local models** via [Ollama](https://ollama.com) (Llama, Mistral, Qwen, DeepSeek, Phi, etc.)
- **Cloud providers** via OpenAI-compatible APIs (NVIDIA NIM, Groq, OpenRouter, OpenAI, Anthropic, etc.)

Everything is self-hosted. No data leaves the machine unless the user explicitly routes a message to a cloud provider.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (User)                      │
│                                                         │
│  Next.js 15 Frontend  (localhost:3000)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  Chat UI     │  │  Settings    │  │   Dashboard   │ │
│  │  (Zustand)   │  │  Dialog      │  │  (RSS+Weather)│ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘ │
│         │                 │                   │         │
│         └─────────────────┴───────────────────┘         │
│                           │ HTTP / SSE (streaming)      │
└───────────────────────────┼─────────────────────────────┘
                            │
            ┌───────────────▼──────────────────┐
            │  FastAPI Backend  (localhost:8001) │
            │                                   │
            │  ┌─────────┐  ┌────────────────┐  │
            │  │ /api/*  │  │  Stream Engine  │  │
            │  │ REST    │  │  (SSE writer)  │  │
            │  └────┬────┘  └───────┬─────────┘  │
            │       │               │             │
            └───────┼───────────────┼─────────────┘
                    │               │
          ┌─────────▼──┐    ┌───────▼──────────────────┐
          │ PostgreSQL  │    │   LLM Providers           │
          │  Database   │    │                           │
          │             │    │  ┌──────────────────────┐ │
          │  chats      │    │  │ Ollama (localhost:   │ │
          │  messages   │    │  │ 11434) — local LLMs  │ │
          │  app_settings    │  └──────────────────────┘ │
          │  registered_│    │  ┌──────────────────────┐ │
          │  models     │    │  │ Cloud APIs (NVIDIA,  │ │
          └─────────────┘    │  │ Groq, OpenRouter,   │ │
                             │  │ OpenAI, Anthropic)  │ │
                             │  └──────────────────────┘ │
                             └───────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 15, React 19 | App framework, SSR, API proxy routes |
| **Styling** | Tailwind CSS, Radix UI | Component primitives, utility classes |
| **State** | Zustand | Client-side store for settings & models |
| **Backend** | FastAPI (Python 3.11+) | REST API + streaming SSE server |
| **ORM** | SQLAlchemy + Alembic | DB models and migrations |
| **Database** | PostgreSQL 15+ | Primary persistent storage |
| **AI (local)** | Ollama | Local LLM inference runtime |
| **AI (cloud)** | OpenAI-compat HTTP | NVIDIA NIM, Groq, OpenRouter, etc. |
| **HTTP client** | httpx | Async requests to Ollama & cloud APIs |

---

## 4. Directory Structure

```
graviton/
├── backend/
│   ├── main.py              ← All API routes + streaming logic
│   ├── models.py            ← SQLAlchemy table definitions
│   ├── database.py          ← DB engine & session factory
│   ├── ollama_client.py     ← Ollama streaming + model list utils
│   ├── requirements.txt
│   └── .env                 ← DATABASE_URL, OLLAMA_URL, PORT, etc.
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx       ← Root layout, font loading, ThemeProvider
│   │   ├── page.tsx         ← Entry point → renders ChatInterface
│   │   └── api/
│   │       ├── [[...path]]/ ← Catch-all proxy to FastAPI backend
│   │       └── dashboard/   ← Server-side RSS + weather aggregator
│   ├── components/
│   │   ├── chat/
│   │   │   ├── chat-interface.tsx   ← Main orchestrator component
│   │   │   ├── chat-sidebar.tsx     ← Chat list, search, projects
│   │   │   ├── chat-input.tsx       ← Message input + file upload
│   │   │   ├── chat-message.tsx     ← Individual message bubble
│   │   │   ├── chat-header.tsx      ← Model selector, mode switcher
│   │   │   ├── settings-dialog.tsx  ← Full settings UI (147 KB)
│   │   │   ├── empty-state.tsx      ← Dashboard (weather + news)
│   │   │   └── markdown-renderer.tsx← Syntax highlighting, LaTeX
│   │   └── ui/              ← Shadcn/Radix UI primitives
│   └── lib/
│       ├── api.ts           ← All fetch() calls to backend
│       ├── store.ts         ← Zustand: settings + registered models
│       ├── chat-store.ts    ← Zustand: active chat state
│       ├── types.ts         ← All TypeScript interfaces & constants
│       └── utils.ts         ← Utility helpers (cn, etc.)
│
└── docs/
    ├── README.md            ← Setup & quickstart guide
    ├── architecture.md      ← This file
    ├── models-and-storage.md← Model management deep-dive
    └── api.md               ← API reference
```

---

## 5. Database Schema

Defined in `backend/models.py` using SQLAlchemy.

### 5.1 `chats`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `title` | String | Editable by user |
| `created_at` | DateTime | Auto-set on insert |
| `updated_at` | DateTime | Auto-updated on message |

### 5.2 `messages`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `chat_id` | UUID (FK → chats) | Cascade delete |
| `role` | String | `user` or `assistant` |
| `content` | Text | Full message text |
| `created_at` | DateTime | |
| `prompt_tokens` | Integer | Filled by LLM response |
| `completion_tokens` | Integer | Filled by LLM response |
| `total_tokens` | Integer | Filled by LLM response |

### 5.3 `app_settings`

| Column | Type | Notes |
|---|---|---|
| `id` | String (PK) | Always `"default"` (single row) |
| `data` | JSON | Entire `Settings` object as one blob |
| `updated_at` | DateTime | |

### 5.4 `registered_models`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `model_id` | String | e.g. `llama3:latest`, `nvidia/llama-3.1-nemotron-70b-instruct` |
| `display_name` | String | User-friendly label |
| `provider` | String | `ollama` or `openai-compat` |
| `api_base` | String | Base URL for cloud providers |
| `api_key` | String | Encrypted/stored API key |
| `model_type` | String | `text`, `vision`, `image` |
| `is_active` | Boolean | Show/hide in model picker |
| `created_at` | DateTime | |

---

## 6. Backend API Reference (`backend/main.py`)

All routes are prefixed `/api/`.

### Health & Settings

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Returns `{status: "ok"}` |
| `GET` | `/api/settings` | Load settings row from DB |
| `PUT` | `/api/settings` | Save full settings JSON blob |

### Chat & Messages

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/chats` | List all chats (id + title + timestamps) |
| `POST` | `/api/chats` | Create a new chat |
| `PUT` | `/api/chats/{id}` | Rename a chat |
| `DELETE` | `/api/chats/{id}` | Delete chat + all messages (cascade) |
| `GET` | `/api/chats/{id}/messages` | Fetch full message history |
| `POST` | `/api/chat` | **Send a message — streaming SSE** |

### Model Management

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/registered-models` | List models from DB |
| `POST` | `/api/registered-models` | Register a new model |
| `PUT` | `/api/registered-models/{id}` | Update name / toggle active |
| `DELETE` | `/api/registered-models/{id}` | Remove from registry |
| `POST` | `/api/registered-models/sync` | Auto-import Ollama models |
| `GET` | `/api/models` | Raw Ollama `/api/tags` passthrough |
| `POST` | `/api/models/pull` | Pull a model via Ollama |
| `DELETE` | `/api/models/{name}` | Delete model from Ollama |

### Administration

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/status` | Ollama reachability + DB health |
| `POST` | `/api/admin/db-test` | Test a custom DB connection URL |
| `GET` | `/api/admin/usage` | Token usage stats per chat |
| `POST` | `/api/upload` | Upload file attachment (returns base64) |

---

## 7. End-to-End Flows

### 7.1 Application Startup

```
Browser loads localhost:3000
        │
        ▼
layout.tsx → ThemeProvider mounts
        │
        ▼
page.tsx → <ChatInterface /> renders
        │
        ├── useSettingsStore.loadSettings()
        │       └── GET /api/settings
        │               └── FastAPI reads app_settings WHERE id='default'
        │                       └── Returns JSON blob → merges into Zustand store
        │                               └── CSS variables injected at :root
        │
        └── useRegisteredModelsStore.loadModels()
                └── GET /api/registered-models
                        └── FastAPI queries registered_models table
                                └── Active models populate the model picker
```

**Auto-sync on startup:** When the backend starts, it calls `auto_sync_models()` which queries `GET http://localhost:11434/api/tags` and upserts any new Ollama models into the `registered_models` table.

---

### 7.2 Sending a Chat Message (Full Stream Flow)

This is the most important flow in the system.

```
User types message → clicks Send (or presses Enter)
        │
        ▼
chat-input.tsx collects:
  - message text
  - attached files (base64 via /api/upload)
  - current model ID (from settings store)
  - chat mode: chat | code | research
        │
        ▼
chat-interface.tsx → POST /api/chat
  Body: {
    chat_id, message, model_id,
    system_prompt, files[], web_search
  }
        │
        ▼ (Next.js API proxy forwards to FastAPI :8001)
        │
FastAPI: POST /api/chat handler
        │
        ├── 1. Load chat history from DB (last N messages)
        │
        ├── 2. Look up model in registered_models
        │       └── Determine provider: "ollama" or "openai-compat"
        │
        ├── 3. Build messages array:
        │       [system_prompt, ...history, user_message]
        │       (if files attached → inject into content)
        │       (if web_search → prepend search results as context)
        │
        ├── 4. Route to provider:
        │
        │   ── If provider == "ollama" ──────────────────────
        │       ollama_client.stream_chat()
        │       POST http://localhost:11434/api/chat (stream=true)
        │       Yields token chunks as they arrive
        │
        │   ── If provider == "openai-compat" ─────────────
        │       httpx.AsyncClient.stream()
        │       POST {api_base}/chat/completions
        │       Headers: Authorization: Bearer {api_key}
        │       Parses SSE delta chunks
        │
        │   ── If model_type == "image" ────────────────────
        │       POST {api_base}/images/generations
        │       Returns base64 PNG
        │       Emits __IMAGE__<base64> marker in stream
        │
        ├── 5. Stream tokens back to browser via SSE
        │       Each chunk: raw text token
        │       End marker: __USAGE__{prompt_tokens,completion_tokens}
        │
        └── 6. After stream complete:
                ├── Save user message → messages table
                ├── Save assistant message → messages table
                ├── Update messages.prompt_tokens / completion_tokens
                └── Auto-title chat if first message (truncate to 60 chars)
```

**Frontend stream reading (chat-interface.tsx):**

```
EventSource / fetch with ReadableStream
        │
        ▼
Read chunks → append to assistantMessage state
        │
        ├── Detect __IMAGE__ marker → render <img> inline
        ├── Detect __USAGE__ marker → store token counts
        └── On stream end → save to local state + show usage badge
```

---

### 7.3 File Upload Flow

```
User attaches file in chat-input.tsx
        │
        ▼
POST /api/upload  { file: FormData }
        │
        ▼
FastAPI:
  ├── If image (jpg/png/gif/webp) → read bytes → return base64
  └── If text/pdf/code → extract text content → return as string
        │
        ▼
Frontend receives { type, content, name }
  ├── Stored in pendingFiles[] state
  └── Sent as part of next /api/chat request body
```

For vision models, images are passed directly in the message content array (OpenAI vision format). For non-vision models, text content is injected as a context block in the system prompt.

---

### 7.4 Settings Save Flow

```
User changes a setting in settings-dialog.tsx
        │
        ▼
Local Zustand store updated immediately (optimistic UI)
CSS variables re-injected at document.documentElement
        │
        ▼
Debounced (500ms) → PUT /api/settings
  Body: { ...fullSettingsObject }
        │
        ▼
FastAPI UPSERT into app_settings WHERE id='default'
  (single row, entire JSON overwritten)
```

Settings are loaded from DB on every app startup, so they persist across sessions and devices sharing the same backend.

---

### 7.5 Model Registration Flow

```
Settings → Models tab → "Add Model" or "Sync"
        │
        ├── SYNC (Ollama local models):
        │       POST /api/registered-models/sync
        │       Backend: GET localhost:11434/api/tags
        │       Upsert each model tag → registered_models table
        │       Returns updated list
        │
        └── MANUAL (cloud provider model):
                User fills: display_name, model_id, provider=openai-compat,
                            api_base (e.g. https://api.groq.com/openai/v1),
                            api_key, model_type
                POST /api/registered-models
                Inserted → registered_models table
                Immediately appears in model picker
```

---

### 7.6 Dashboard (Empty State) Flow

When no chat is selected, the app shows a live dashboard.

```
empty-state.tsx mounts
        │
        ▼
Reads from settings: dashboardCity, dashboardTopics, dashboardSubTopics
        │
        ▼
GET /api/dashboard?categories=world,tech&subtopics=tech_hn&city=Hyderabad
  (This is a Next.js API route — NOT the FastAPI backend)
        │
        ▼
frontend/app/api/dashboard/route.ts:
  ├── Fetches weather: https://wttr.in/{city}?format=j1
  │       (cached 30 min via Next.js revalidate)
  └── Fetches RSS feeds in parallel:
          Per selected sub-topic → its RSS URL
          Falls back to category defaults if no sub-topic selected
          Merges + deduplicates + sorts by date
          (cached 5 min via Next.js revalidate)
        │
        ▼
Returns { weather: {...}, news: { world: [...], tech: [...] } }
        │
        ▼
empty-state.tsx renders:
  ├── Weather card (temp, humidity, wind, 3-day forecast)
  └── News cards per category (title, snippet, date, source link)
```

---

## 8. Frontend State Architecture

### 8.1 Zustand Stores

**`useSettingsStore`** (`lib/store.ts`)
- Holds the entire `Settings` object (model, theme, UI customization)
- `loadSettings()` — fetches from DB on mount
- `updateSettings()` — updates local state + debounced PUT to backend
- `applyTheme()` — injects CSS custom properties at `:root`

**`useRegisteredModelsStore`** (`lib/store.ts`)
- Holds array of active `RegisteredModel` objects
- `loadModels()` — fetches from DB on mount
- Used by model picker dropdown in chat header

**`useChatStore`** (`lib/chat-store.ts`)
- Holds `activeChatId`, local message draft state

### 8.2 localStorage Usage (Intentionally Minimal)

| Key | Value | Purpose |
|---|---|---|
| `admin-unlocked` | `"true"` | PIN session persistence |
| `sidebar-collapsed` | `"true"/"false"` | Sidebar open/close state |
| `theme-flash-prevent` | theme string | Prevents FOUC on load |

Everything else (chats, messages, settings, models) lives in **PostgreSQL**.

---

## 9. UI Theming System

The theme system is implemented entirely via CSS custom properties injected at `:root`.

```
User selects theme preset (e.g. "Midnight Violet")
        │
        ▼
PRESET_THEMES[id].vars merged into Settings object
        │
        ▼
applyTheme(settings) called in ThemeProvider
        │
        ▼
document.documentElement.style.setProperty('--accent', ...)
document.documentElement.style.setProperty('--glass-blur', ...)
document.documentElement.style.setProperty('--border-radius', ...)
... (20+ variables)
        │
        ▼
All components pick up new values via var(--accent), etc.
```

### Built-in Theme Presets

| Preset | Style |
|---|---|
| Editorial Dark | Warm paper, sharp borders, newspaper |
| Editorial Light | Clean paper, high contrast |
| Midnight Violet | Deep dark, vivid violet glow |
| Ocean Glass | Frosted glass, cyan palette |
| Forest Mono | Monospace, earthy greens, terminal |
| Rose Dawn | Soft light, warm rose |
| Amber Tech | Retro terminal amber, dot grid |
| Sky Clean | Light, airy, blue, productivity |

Users can further customize: accent color, glass opacity, blur, glow intensity, border radius, font family, UI density, background pattern (grid/dots/mesh), and more.

---

## 10. Security

### Admin PIN Gate
- Settings panels for **Database** and **System Admin** are protected by a PIN
- Default: `1234` (hardcoded in `settings-dialog.tsx`)
- Session stored as `localStorage["admin-unlocked"] = "true"`
- Clears when Settings dialog is closed

### API Keys
- Stored in `registered_models.api_key` column in plain text
- Sent over HTTP to backend (intended for local network use only)
- Never exposed to the frontend — only used server-side in backend HTTP calls

### CORS
- FastAPI configured with `FRONTEND_URL` as the only allowed CORS origin
- Default: `http://localhost:3000`

---

## 11. Provider Integration Details

### Ollama (Local)

```python
# ollama_client.py
POST http://localhost:11434/api/chat
{
  "model": "llama3:latest",
  "messages": [...],
  "stream": true
}
# Response: newline-delimited JSON chunks
# { "message": { "content": "token" }, "done": false }
```

### OpenAI-Compatible (Cloud)

```python
# main.py — _stream_openai_compat()
POST {api_base}/chat/completions
Headers: { "Authorization": "Bearer {api_key}" }
{
  "model": "nvidia/llama-3.1-nemotron-70b-instruct",
  "messages": [...],
  "stream": true
}
# Response: SSE data: {"choices":[{"delta":{"content":"token"}}]}
```

### Supported Cloud Providers (via openai-compat)

| Provider | api_base |
|---|---|
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` |
| Groq | `https://api.groq.com/openai/v1` |
| OpenRouter | `https://openrouter.ai/api/v1` |
| OpenAI | `https://api.openai.com/v1` |
| Anthropic* | `https://api.anthropic.com/v1` |
| Together AI | `https://api.together.xyz/v1` |

> *Anthropic has partial OpenAI compatibility; full support may need a thin adapter.

### Image Generation

When `model_type == "image"`:
```python
POST {api_base}/images/generations
{ "model": "...", "prompt": "...", "n": 1, "size": "1024x1024" }
# Returns base64 PNG
# Backend emits: __IMAGE__{base64string} in stream
# Frontend detects marker → renders <img src="data:image/png;base64,...">
```

---

## 12. Chat Modes

Users can switch the assistant's behavior via mode presets:

| Mode | System Prompt Injected |
|---|---|
| **Chat** | None (default conversational) |
| **Code** | "You are an expert software engineer. Provide precise, production-quality code…" |
| **Research** | "You are a research analyst. Synthesize information thoroughly, cite reasoning…" |

Mode is sent as `system_prompt` in the `/api/chat` body.

---

## 13. Stream Protocol (Custom Markers)

The SSE stream from `/api/chat` uses plain-text chunks with special markers:

| Marker | Format | Meaning |
|---|---|---|
| Token | raw text | Append to assistant message |
| Image | `__IMAGE__{base64}` | Render inline image |
| Usage | `__USAGE__{json}` | Token count metadata |
| Error | `__ERROR__{message}` | Display error to user |

This avoids adding JSON overhead to every token and keeps latency minimal.

---

## 14. Known Gaps & Roadmap

### Currently in localStorage (Should be in DB)

| Feature | Current Storage | Needed |
|---|---|---|
| Pinned Chats | `localStorage` | `pinned_chats` DB table |
| Custom Projects | `localStorage` | `projects` DB table |
| Project → Chat assignment | `localStorage` | `chat_project_id` FK |

### Missing Features

| Feature | Status |
|---|---|
| Google AI Studio (Gemini) | Not yet — needs custom stream adapter (non-OpenAI format) |
| Anthropic native API | Partial — needs `anthropic-version` header handling |
| PIN management UI | UI exists, hardcoded validation |
| Multi-user / auth | Not implemented — single user assumed |
| Model Lab analytics | UI shell exists, detailed metrics incomplete |

---

## 15. Running the Full Stack

```bash
# Terminal 1 — Ollama
ollama serve

# Terminal 2 — Backend
cd backend
.\\venv\\Scripts\\activate        # Windows
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Terminal 3 — Frontend
cd frontend
npm run dev                       # runs on localhost:3000
```

### Environment (`backend/.env`)

```
DATABASE_URL=postgresql://postgres:<password>@localhost:5433/ai_chatbot
OLLAMA_URL=http://localhost:11434/api
PORT=8001
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=        # optional
ANTHROPIC_API_KEY=     # optional
```

---

## 16. Data Flow Summary Diagram

```
User Input
    │
    ▼
chat-input.tsx
    │ POST /api/chat (via Next.js proxy)
    ▼
FastAPI main.py
    ├── Reads: registered_models (which provider?)
    ├── Reads: messages (chat history)
    │
    ├─── Ollama path ──► POST localhost:11434/api/chat ──► stream chunks
    ├─── Cloud path  ──► POST {api_base}/chat/completions ──► stream chunks
    └─── Image path  ──► POST {api_base}/images/generations ──► base64
    │
    │ SSE stream ──► Next.js proxy ──► browser ReadableStream
    ▼
chat-interface.tsx
    ├── Appends tokens to assistantMessage state
    ├── Detects __IMAGE__ → renders inline
    ├── Detects __USAGE__ → saves token counts
    └── On complete:
            ├── Writes to messages table (user + assistant)
            └── Auto-titles chat if new
```

---

*This document covers the complete architecture as of May 2026. For model management specifics, see `docs/models-and-storage.md`. For the API reference, see `docs/api.md`.*
