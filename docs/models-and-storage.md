# Graviton — Model Management & Storage Guide

## Table of Contents

- [How to Add Models](#how-to-add-models)
  - [Ollama (Local)](#ollama-local--recommended)
  - [Cloud & External Providers](#cloud--external-providers)
- [Storage Audit](#storage-audit--what-is-in-db-vs-localstorage)
- [Settings Flow](#settings-flow)
- [Model Selection Flow](#model-selection-flow)

---

## How to Add Models

### Ollama (Local) — Recommended

#### Step 1 — Pull the model

Downloads the model weights to your machine via the Settings UI.

```
Settings → Models → Pull from Ollama
Enter:  llama3.2   or   codellama:7b   or   mistral:latest
```

#### Step 2 — Register it in the DB

After pulling, click **Sync** to discover all installed Ollama models and register any that are not already in the database.

```
Settings → Models → Sync
```

#### Or register manually

If you already installed a model via the Ollama CLI (`ollama pull <name>`), you can register it directly without pulling again.

```
Settings → Models → Register Model
Ollama name:   llama3:latest
Display name:  Llama 3        (optional — auto-generated if left blank)
```

#### Popular models reference

| Model | Pull name | Best for |
|---|---|---|
| Llama 3.2 | `llama3.2` | General chat |
| Llama 3.1 8B | `llama3.1:8b` | Balanced quality/speed |
| Mistral 7B | `mistral` | Balanced |
| DeepSeek Coder | `deepseek-coder` | Code generation |
| Phi-3 Mini | `phi3:mini` | Fast, low RAM |
| Gemma 2 | `gemma2` | Google's open model |
| Qwen 2.5 | `qwen2.5` | Multilingual |
| CodeLlama | `codellama:7b` | Code + chat |
| Llava | `llava` | Vision (images) |

> Browse all available models at [ollama.com/library](https://ollama.com/library)

---

### Cloud & External Providers

The current `registered_models` table is **Ollama-only**. To support external cloud providers, the DB schema and backend routing need to be extended.

#### Schema extension needed (`backend/models.py`)

```python
class RegisteredModel(Base):
    # existing columns
    ollama_name   = Column(String, unique=True)
    display_name  = Column(String)
    is_active     = Column(Boolean, default=True)

    # new columns to add
    provider      = Column(String, default='ollama')   # 'ollama' | 'openai-compat' | 'google'
    api_base_url  = Column(String, nullable=True)      # custom endpoint URL
    api_key       = Column(String, nullable=True)      # stored server-side (not in browser)
```

#### Providers that use OpenAI-compatible format

These work with the same streaming format as OpenAI — only the base URL and API key differ. The backend chat endpoint just needs to detect `provider = 'openai-compat'` and switch the HTTP target.

| Provider | Base URL | Get API key |
|---|---|---|
| **NVIDIA NIM** | `https://integrate.api.nvidia.com/v1` | [build.nvidia.com](https://build.nvidia.com) |
| **Groq** | `https://api.groq.com/openai/v1` | [console.groq.com](https://console.groq.com) |
| **OpenRouter** | `https://openrouter.ai/api/v1` | [openrouter.ai](https://openrouter.ai) |
| **Together AI** | `https://api.together.xyz/v1` | [api.together.xyz](https://api.together.xyz) |
| **Fireworks AI** | `https://api.fireworks.ai/inference/v1` | [fireworks.ai](https://fireworks.ai) |
| **LM Studio (local)** | `http://localhost:1234/v1` | None — runs locally |

#### Backend routing change needed (`backend/main.py`)

```python
# In the generate() function inside /api/chat:

db_model = db.query(models.RegisteredModel).filter(
    models.RegisteredModel.ollama_name == model
).first()

if db_model and db_model.provider == 'openai-compat':
    async for chunk in _stream_openai_compat(
        model=model,
        messages=ollama_messages,
        api_key=db_model.api_key,
        base_url=db_model.api_base_url,
    ):
        yield chunk
else:
    # default: Ollama
    async for chunk in ollama_client.chat_with_ollama(model, ollama_messages):
        yield chunk
```

#### Google AI Studio

Uses its own SDK (`google-generativeai`) — not OpenAI-compatible. Requires a separate streaming adapter.

```bash
pip install google-generativeai
```

```python
import google.generativeai as genai

async def _stream_google(model: str, messages: list, api_key: str):
    genai.configure(api_key=api_key)
    gmodel = genai.GenerativeModel(model)
    response = gmodel.generate_content(
        [m["content"] for m in messages],
        stream=True,
    )
    for chunk in response:
        yield chunk.text
```

> Get a free API key at [aistudio.google.com](https://aistudio.google.com)

---

## Storage Audit — What is in DB vs localStorage

### ✅ Stored in PostgreSQL (persists across devices/browsers)

| Data | Table | Written when |
|---|---|---|
| All chats | `chats` | First message sent in a new chat |
| All messages | `messages` | Every send/receive |
| App settings | `app_settings` | Settings dialog → Save |
| Registered models | `registered_models` | Sync or manual register |

### ⚠️ Still in localStorage (browser-only, not synced)

| Key | Data | Notes |
|---|---|---|
| `graviton-theme` | Dark / light / system | Needed before DB loads to avoid flash |
| `sidebar-collapsed` | Sidebar open/close state | UI micro-preference |
| `graviton_projects` | Project list | **Not yet migrated to DB** |
| `graviton_chat_project` | Chat → project assignments | **Not yet migrated to DB** |
| `graviton_pinned` | Pinned chat IDs | **Not yet migrated to DB** |
| `admin-unlocked` | Admin PIN session | Cleared on browser close |
| `nova-settings` | Legacy settings key | Read-only fallback when DB unreachable |

> **To fully remove localStorage dependency:** Projects, pinned chats, and chat-project assignments need `projects` and `chat_project_assignments` tables added to the backend — similar to the migration done for settings.

---

## Settings Flow

```
App load
  └─ useSettingsStore.load()
       └─ GET /api/settings
            ├─ success → merge with DEFAULT_SETTINGS, store in Zustand
            └─ fail    → read 'nova-settings' from localStorage (fallback only)

User changes a setting
  └─ useSettingsStore.save(newSettings)
       ├─ update Zustand state immediately (UI stays responsive)
       └─ PUT /api/settings  →  PostgreSQL app_settings.data (JSON blob)
```

Settings are stored as a **single JSON blob** in `app_settings` (one row, `id = "default"`). This means adding new settings fields requires no DB migration — just update `DEFAULT_SETTINGS` in `frontend/lib/types.ts`.

---

## Model Selection Flow

```
App load
  └─ useModelsStore.load()
       └─ GET /api/registered-models  →  PostgreSQL registered_models
            └─ active models mapped to { id: ollama_name, name: display_name }
            └─ populates the model dropdown in the chat input

Backend startup
  └─ auto_sync_models()
       └─ GET Ollama /api/tags
       └─ any new installed models auto-registered in registered_models

User selects a model
  └─ settings.model = ollama_name  (e.g. "llama3:latest")
  └─ saved to DB via PUT /api/settings

User sends a message
  └─ POST /api/chat  { model: "llama3:latest", messages: [...] }
       └─ backend routes to Ollama unconditionally
       └─ streams response back via StreamingResponse
       └─ full response saved to messages table on completion
```

---

## Quick Reference — API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/settings` | Load settings from DB |
| `PUT` | `/api/settings` | Save settings to DB |
| `GET` | `/api/registered-models` | List all registered models |
| `POST` | `/api/registered-models` | Register a model manually |
| `PUT` | `/api/registered-models/{id}` | Rename or toggle active |
| `DELETE` | `/api/registered-models/{id}` | Remove from registry |
| `POST` | `/api/registered-models/sync` | Auto-import from Ollama |
| `GET` | `/api/models` | Raw Ollama model list (passthrough) |
| `POST` | `/api/models/pull` | Download a model via Ollama |
| `DELETE` | `/api/models/{name}` | Delete a model from Ollama |
