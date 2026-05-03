from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, create_engine
from typing import List, Optional
from datetime import datetime
import os
import httpx
import json
import uuid
from pathlib import Path
from datetime import datetime, timezone

import models, database, ollama_client
from pydantic import BaseModel, ConfigDict

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    try:
        models.Base.metadata.create_all(bind=database.engine)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Warning: Could not connect to database. {e}")

    # Migrate: add new columns if they don't exist
    try:
        from sqlalchemy import inspect
        inspector = inspect(database.engine)
        
        # Check registered_models
        rm_cols = [c["name"] for c in inspector.get_columns("registered_models")]
        # Check messages
        msg_cols = [c["name"] for c in inspector.get_columns("messages")]

        with database.engine.connect() as conn:
            # registered_models migrations
            for col, ddl in [
                ("provider",     "ALTER TABLE registered_models ADD COLUMN provider VARCHAR DEFAULT 'ollama' NOT NULL"),
                ("api_base_url", "ALTER TABLE registered_models ADD COLUMN api_base_url VARCHAR"),
                ("api_key",      "ALTER TABLE registered_models ADD COLUMN api_key VARCHAR"),
            ]:
                if col not in rm_cols:
                    conn.execute(text(ddl))
                    conn.commit()

            # messages migrations
            for col, ddl in [
                ("prompt_tokens",     "ALTER TABLE messages ADD COLUMN prompt_tokens INTEGER"),
                ("completion_tokens", "ALTER TABLE messages ADD COLUMN completion_tokens INTEGER"),
                ("total_tokens",      "ALTER TABLE messages ADD COLUMN total_tokens INTEGER"),
                ("model",             "ALTER TABLE messages ADD COLUMN model VARCHAR"),
                ("latency_ms",        "ALTER TABLE messages ADD COLUMN latency_ms INTEGER"),
            ]:
                if col not in msg_cols:
                    conn.execute(text(ddl))
                    conn.commit()
    except Exception as e:
        print(f"Warning: Migration check failed: {e}")

    # Seed registered_models from Ollama on startup if empty
    try:
        with database.SessionLocal() as db:
            count = db.query(models.RegisteredModel).count()
            if count == 0:
                installed = await ollama_client.get_ollama_models()
                for name in installed:
                    display = name.split(":")[0].replace("-", " ").title()
                    db.add(models.RegisteredModel(ollama_name=name, display_name=display, provider='ollama'))
                db.commit()
                print(f"Initial model seed completed. Added {len(installed)} models.")
    except Exception as e:
        print(f"Warning: Auto-seed models failed: {e}")
    
    yield

app = FastAPI(title="Graviton AI API", lifespan=lifespan)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# ── Pydantic schemas ────────────────────────────────────────────────────────

class MessageSchema(BaseModel):
    role: str
    content: str

class ChatCreate(BaseModel):
    title: str

class ChatUpdate(BaseModel):
    title: Optional[str] = None

class SettingsUpdate(BaseModel):
    data: dict

class RegisteredModelCreate(BaseModel):
    ollama_name: str
    display_name: str
    provider: str = 'ollama'
    api_base_url: Optional[str] = None
    api_key: Optional[str] = None

class RegisteredModelUpdate(BaseModel):
    display_name: Optional[str] = None
    is_active: Optional[bool] = None
    api_key: Optional[str] = None

class RegisteredModelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    ollama_name: str
    display_name: str
    is_active: bool
    provider: str
    api_base_url: Optional[str] = None
    created_at: datetime
    has_api_key: bool = False
    # api_key intentionally excluded from response

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    role: str
    content: str
    created_at: datetime
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None

class ChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    created_at: datetime
    updated_at: datetime

# ── Health ──────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# ── Settings ────────────────────────────────────────────────────────────────

@app.get("/api/settings")
def get_settings(db: Session = Depends(database.get_db)):
    row = db.query(models.AppSettings).filter(models.AppSettings.id == "default").first()
    if not row:
        row = models.AppSettings(id="default", data={})
        db.add(row)
        db.commit()
        db.refresh(row)
    return {"data": row.data}

@app.put("/api/settings")
def update_settings(body: SettingsUpdate, db: Session = Depends(database.get_db)):
    row = db.query(models.AppSettings).filter(models.AppSettings.id == "default").first()
    if not row:
        row = models.AppSettings(id="default", data=body.data)
        db.add(row)
    else:
        row.data = body.data
    db.commit()
    return {"data": row.data}

# ── Registered Models ────────────────────────────────────────────────────────

@app.get("/api/registered-models", response_model=List[RegisteredModelResponse])
def list_registered_models(db: Session = Depends(database.get_db)):
    rows = db.query(models.RegisteredModel).order_by(models.RegisteredModel.created_at.asc()).all()
    for r in rows:
        r.has_api_key = bool(r.api_key and r.api_key.strip())
    return rows

@app.post("/api/registered-models", response_model=RegisteredModelResponse)
def create_registered_model(body: RegisteredModelCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.RegisteredModel).filter(
        models.RegisteredModel.ollama_name == body.ollama_name
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Model already registered")
    m = models.RegisteredModel(
        ollama_name=body.ollama_name,
        display_name=body.display_name,
        provider=body.provider,
        api_base_url=body.api_base_url,
        api_key=body.api_key,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    m.has_api_key = bool(m.api_key and m.api_key.strip())
    return m

@app.put("/api/registered-models/{model_id}", response_model=RegisteredModelResponse)
def update_registered_model(model_id: str, body: RegisteredModelUpdate, db: Session = Depends(database.get_db)):
    m = db.query(models.RegisteredModel).filter(models.RegisteredModel.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    if body.display_name is not None:
        m.display_name = body.display_name
    if body.is_active is not None:
        m.is_active = body.is_active
    db.commit()
    db.refresh(m)
    m.has_api_key = bool(m.api_key and m.api_key.strip())
    return m

@app.delete("/api/registered-models/{model_id}")
def delete_registered_model(model_id: str, db: Session = Depends(database.get_db)):
    m = db.query(models.RegisteredModel).filter(models.RegisteredModel.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    db.delete(m)
    db.commit()
    return {"message": "Deleted"}

@app.post("/api/registered-models/sync")
async def sync_models_from_ollama(db: Session = Depends(database.get_db)):
    """Pull installed Ollama models and upsert into registered_models."""
    installed = await ollama_client.get_ollama_models()
    added = []
    for name in installed:
        existing = db.query(models.RegisteredModel).filter(
            models.RegisteredModel.ollama_name == name
        ).first()
        if not existing:
            display = name.split(":")[0].replace("-", " ").title()
            m = models.RegisteredModel(ollama_name=name, display_name=display)
            db.add(m)
            added.append(name)
    db.commit()
    return {"synced": len(installed), "added": added}

# ── Models (Ollama passthrough) ──────────────────────────────────────────────

@app.get("/api/models")
async def list_models():
    models_list = await ollama_client.get_ollama_models()
    return {"models": models_list}

@app.post("/api/models/pull")
async def pull_model(body: dict = Body(...)):
    model_name = body.get("model", "").strip()
    if not model_name:
        raise HTTPException(status_code=400, detail="Model name required")

    async def stream_pull():
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    f"{ollama_client.OLLAMA_URL}/pull",
                    json={"name": model_name},
                ) as r:
                    async for line in r.aiter_lines():
                        if line:
                            yield line + "\n"
        except Exception as e:
            yield json.dumps({"error": str(e)}) + "\n"

    return StreamingResponse(stream_pull(), media_type="text/plain")

@app.delete("/api/models/{model_name:path}")
async def delete_model(model_name: str):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.request(
                "DELETE",
                f"{ollama_client.OLLAMA_URL}/delete",
                json={"name": model_name},
            )
            if r.status_code == 200:
                return {"message": f"Deleted {model_name}"}
            raise HTTPException(status_code=r.status_code, detail=r.text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── File Upload ─────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    MAX_SIZE = 10 * 1024 * 1024  # 10 MB
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    file_id = str(uuid.uuid4())
    suffix = Path(file.filename or "file").suffix or ".txt"
    dest = UPLOAD_DIR / f"{file_id}{suffix}"
    dest.write_bytes(contents)

    return {"file_id": file_id, "filename": file.filename, "size": len(contents)}

# ── Web Search ──────────────────────────────────────────────────────────────

async def _ddg_search(query: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
                headers={"User-Agent": "Graviton/1.0"},
            )
            data = r.json()

        parts: list[str] = []
        if data.get("AbstractText"):
            parts.append(f"**{data.get('Heading', 'Summary')}**\n{data['AbstractText']}")
            if data.get("AbstractURL"):
                parts.append(f"Source: {data['AbstractURL']}")

        for topic in data.get("RelatedTopics", [])[:5]:
            if isinstance(topic, dict) and topic.get("Text"):
                parts.append(f"• {topic['Text'][:200]}")

        for result in data.get("Results", [])[:3]:
            if isinstance(result, dict) and result.get("Text"):
                parts.append(f"• {result['Text'][:200]}")

        return "\n\n".join(parts)
    except Exception:
        return ""

# ── Provider streaming ──────────────────────────────────────────────────────

async def _stream_openai_compat(model: str, messages: list, api_key: str, base_url: str):
    """Stream from any OpenAI-compatible API (NVIDIA NIM, Groq, OpenRouter, etc.)."""
    headers = {
        "Content-Type": "application/json",
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "stream_options": {"include_usage": True}
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{base_url.rstrip('/')}/chat/completions",
            headers=headers,
            json=payload,
        ) as r:
            if r.status_code != 200:
                body = await r.aread()
                raise Exception(f"Provider error {r.status_code}: {body.decode()[:300]}")
            async for line in r.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    break
                try:
                    chunk = json.loads(data)
                    # Check for usage info (usually in the last chunk when include_usage is True)
                    if "usage" in chunk and chunk["usage"]:
                        yield f"__USAGE__:{json.dumps(chunk['usage'])}"
                    
                    if "choices" in chunk and len(chunk["choices"]) > 0:
                        delta = chunk["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta
                except Exception:
                    continue

# ── Chat ────────────────────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat_endpoint(
    body: dict = Body(...),
    db: Optional[Session] = Depends(database.get_db_optional)
):
    messages_data = body.get("messages", [])
    model = body.get("model", "llama3")
    chat_id = body.get("chatId")
    system_prompt = body.get("systemPrompt", "")
    file_ids = body.get("fileIds", [])
    web_search = body.get("webSearch", False)
    if not messages_data:
        raise HTTPException(status_code=400, detail="No messages provided")

    if chat_id and db:
        try:
            user_msg = messages_data[-1]
            db_msg = models.Message(
                chat_id=chat_id,
                role=user_msg["role"],
                content=user_msg.get("content", "") or next(
                    (p["text"] for p in user_msg.get("parts", []) if p["type"] == "text"), ""
                ),
                model=model,
            )
            db.add(db_msg)
            db.commit()
        except Exception as e:
            print(f"Warning: Could not save user message: {e}")
 
    start_time = datetime.now(timezone.utc)

    async def generate():
        combined_system = system_prompt

        # Inject uploaded file contents
        for fid in file_ids:
            matches = list(UPLOAD_DIR.glob(f"{fid}.*"))
            if matches:
                try:
                    text = matches[0].read_text(encoding="utf-8", errors="replace")
                    combined_system += f"\n\n[Attached file: {matches[0].name}]\n{text[:8000]}"
                except Exception:
                    pass

        # Inject web search results
        if web_search and messages_data:
            last_user = next((m for m in reversed(messages_data) if m.get("role") == "user"), None)
            if last_user:
                query = (last_user.get("content", "") or "")[:200]
                search_result = await _ddg_search(query)
                if search_result:
                    combined_system += (
                        f'\n\n[Web search results for: "{query}"]\n'
                        f"{search_result}\n\n"
                        "Use these results to answer accurately with current information."
                    )

        ollama_messages = []
        if combined_system:
            ollama_messages.append({"role": "system", "content": combined_system})

        for m in messages_data:
            content = m.get("content", "")
            if not content and "parts" in m:
                content = next((p["text"] for p in m["parts"] if p["type"] == "text"), "")
            ollama_messages.append({"role": m["role"], "content": content})

        full_response = ""
        error_msg = None
        usage_data = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

        # Look up the registered model to determine provider
        db_model = None
        if db:
            db_model = db.query(models.RegisteredModel).filter(
                models.RegisteredModel.ollama_name == model
            ).first()

        try:
            # Determine provider logic
            is_openai_compat = db_model and db_model.provider == 'openai-compat'

            if is_openai_compat:
                if not db_model.api_base_url:
                    raise Exception(f"Cloud provider '{db_model.display_name}' is missing a base URL.")
                
                # Stream from OpenAI-compatible provider
                async for chunk in _stream_openai_compat(
                    model=model,
                    messages=ollama_messages,
                    api_key=db_model.api_key or "",
                    base_url=db_model.api_base_url,
                ):
                    if chunk.startswith("__USAGE__:"):
                        try:
                            usage_data.update(json.loads(chunk[10:]))
                        except Exception: pass
                        continue
                    full_response += chunk
                    yield chunk
            else:
                # Default to Ollama
                async for chunk in ollama_client.chat_with_ollama(model, ollama_messages):
                    if chunk.startswith("__USAGE__:"):
                        try:
                            usage_data.update(json.loads(chunk[10:]))
                        except Exception: pass
                        continue
                    full_response += chunk
                    yield chunk
        except Exception as e:
            err = str(e)
            if "not found" in err.lower() and not is_openai_compat:
                error_msg = f"\n\n⚠️ Model '{model}' is not installed. Go to Settings → Models and pull it first."
            elif "401" in err or "unauthorized" in err.lower():
                error_msg = f"\n\n⚠️ Authentication failed for '{model}'. Please verify your API Key in Settings."
            elif "404" in err and is_openai_compat:
                error_msg = f"\n\n⚠️ Model '{model}' not found on the provider's server. Check the Model ID."
            else:
                error_msg = f"\n\n⚠️ {err}"

        if error_msg is not None:
            yield error_msg
            return

        if chat_id and full_response:
            try:
                with database.SessionLocal() as session:
                    assistant_msg = models.Message(
                        chat_id=chat_id,
                        role="assistant",
                        content=full_response,
                        model=model,
                        prompt_tokens=usage_data.get("prompt_tokens"),
                        completion_tokens=usage_data.get("completion_tokens"),
                        total_tokens=usage_data.get("total_tokens"),
                        latency_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000),
                    )
                    session.add(assistant_msg)
                    db_chat = session.query(models.Chat).filter(models.Chat.id == chat_id).first()
                    if db_chat:
                        db_chat.updated_at = datetime.now(timezone.utc)
                    session.commit()
            except Exception as e:
                print(f"Warning: Could not save assistant message: {e}")

    return StreamingResponse(generate(), media_type="text/plain")

# ── Chats CRUD ──────────────────────────────────────────────────────────────

@app.post("/api/chats/{chat_id}/generate-title")
async def generate_chat_title(chat_id: str, body: dict = Body({}), db: Session = Depends(database.get_db)):
    db_chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not db_chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    messages = db.query(models.Message).filter(models.Message.chat_id == chat_id).order_by(models.Message.created_at.asc()).limit(3).all()
    if not messages:
        return {"title": db_chat.title}

    context = "\n".join([f"{m.role}: {m.content[:300]}" for m in messages])
    req_model_name = body.get("model")
    reg_model = None
    if req_model_name:
        reg_model = db.query(models.RegisteredModel).filter(models.RegisteredModel.ollama_name == req_model_name).first()
    if not reg_model:
        reg_model = db.query(models.RegisteredModel).filter(models.RegisteredModel.is_active == True).first()
    model_name = reg_model.ollama_name if reg_model else (req_model_name or "llama3")

    system_instr = "You are a title generator. Summarize the user's intent into a 2-4 word title. NO quotes. NO period. NO 'Title:'. NO intro. Just the words."
    user_prompt = f"Summarize this conversation into a concise title (max 5 words):\n\n{context}"

    try:
        full_response = ""
        # Use a short timeout for title generation to avoid blocking
        if reg_model and reg_model.provider == 'openai-compat':
             async for chunk in _stream_openai_compat(model=model_name, messages=[{"role": "system", "content": system_instr}, {"role": "user", "content": user_prompt}], api_key=reg_model.api_key or "", base_url=reg_model.api_base_url):
                full_response += chunk
        else:
            async for chunk in ollama_client.chat_with_ollama(model_name, [{"role": "system", "content": system_instr}, {"role": "user", "content": user_prompt}]):
                full_response += chunk
        
        raw_title = full_response.strip().split('\n')[0].replace('Title:', '').replace('title:', '').strip()
        title = raw_title.strip('"').strip("'").strip('`').strip('.').strip()
        
        if title and len(title) > 1:
            # Final check to ensure it's not a full sentence
            if len(title.split()) > 7:
                title = " ".join(title.split()[:5]) + "..."
            
            db_chat.title = title
            db.commit()
            print(f"Generated title for {chat_id}: {title}")
            return {"title": title}
    except Exception as e:
        print(f"Title generation error for {chat_id}: {e}")
    return {"title": db_chat.title}

@app.get("/api/chats", response_model=List[ChatResponse])
def get_chats(db: Session = Depends(database.get_db)):
    chats = db.query(models.Chat).order_by(models.Chat.updated_at.desc()).all()
    return chats

@app.post("/api/chats")
def create_chat(chat: ChatCreate, db: Session = Depends(database.get_db)):
    db_chat = models.Chat(title=chat.title)
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

@app.put("/api/chats/{chat_id}")
def update_chat(chat_id: str, chat: ChatUpdate, db: Session = Depends(database.get_db)):
    db_chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not db_chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.title is not None:
        db_chat.title = chat.title
    db.commit()
    db.refresh(db_chat)
    return db_chat

@app.delete("/api/chats/{chat_id}")
def delete_chat(chat_id: str, db: Session = Depends(database.get_db)):
    db_chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not db_chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    db.delete(db_chat)
    db.commit()
    return {"message": "Chat deleted"}

@app.get("/api/chats/{chat_id}/messages", response_model=List[MessageResponse])
def get_chat_messages(chat_id: str, db: Session = Depends(database.get_db)):
    messages = (
        db.query(models.Message)
        .filter(models.Message.chat_id == chat_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )
    return messages


# ── Admin ───────────────────────────────────────────────────────────────────

@app.get("/api/admin/status")
async def admin_status():
    ollama_ok = False
    models_count = 0
    db_ok = False

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{ollama_client.OLLAMA_URL}/tags")
            if r.status_code == 200:
                ollama_ok = True
                models_count = len(r.json().get("models", []))
    except Exception:
        pass

    try:
        db = database.SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_ok = True
    except Exception:
        pass

    raw_db_url = database.SQLALCHEMY_DATABASE_URL
    masked_db_url = raw_db_url
    if "@" in raw_db_url:
        user_pass = raw_db_url.split("@")[0].split("://")[-1]
        if ":" in user_pass:
            password = user_pass.split(":")[-1]
            masked_db_url = raw_db_url.replace(f":{password}@", ":****@")

    return {
        "ollama": {
            "status": "ok" if ollama_ok else "error",
            "url": ollama_client.OLLAMA_URL,
            "models": models_count,
        },
        "database": {
            "status": "ok" if db_ok else "error",
            "url": masked_db_url,
        },
        "version": "1.0.0",
    }

@app.get("/api/admin/usage")
async def get_global_usage(db: Session = Depends(database.get_db)):
    from sqlalchemy import func
    usage = db.query(
        func.sum(models.Message.prompt_tokens).label("prompt"),
        func.sum(models.Message.completion_tokens).label("completion"),
        func.sum(models.Message.total_tokens).label("total")
    ).first()
    
    return {
        "prompt_tokens": usage.prompt or 0,
        "completion_tokens": usage.completion or 0,
        "total_tokens": usage.total or 0
    }

@app.get("/api/admin/model-usage")
async def get_model_usage(db: Session = Depends(database.get_db)):
    from sqlalchemy import func
    
    # Get local database stats grouped by model
    # We use func.count for requests and func.sum for tokens
    stats = db.query(
        models.Message.model,
        func.count(models.Message.id).label("requests"),
        func.sum(models.Message.prompt_tokens).label("prompt"),
        func.sum(models.Message.completion_tokens).label("completion"),
        func.sum(models.Message.total_tokens).label("total"),
        func.avg(models.Message.latency_ms).label("avg_latency")
    ).group_by(models.Message.model).all()
    
    model_stats = []
    for s in stats:
        # Get provider info for this model
        reg = db.query(models.RegisteredModel).filter(
            models.RegisteredModel.ollama_name == s.model
        ).first()
        
        provider_name = reg.provider if reg else "ollama"
        display_name = reg.display_name if reg else s.model
        
        stat_item = {
            "model": s.model,
            "display_name": display_name,
            "provider": provider_name,
            "requests": s.requests or 0,
            "prompt_tokens": s.prompt or 0,
            "completion_tokens": s.completion or 0,
            "total_tokens": s.total or 0,
            "avg_latency_ms": s.avg_latency or 0,
            "tokens_per_sec": (s.total / (s.avg_latency / 1000)) if s.avg_latency and s.avg_latency > 0 else 0,
            "credits": None
        }
        
        # If OpenRouter, try to fetch credits
        if reg and reg.provider == "openai-compat" and reg.api_key and "openrouter.ai" in (reg.api_base_url or ""):
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    r = await client.get(
                        "https://openrouter.ai/api/v1/key",
                        headers={"Authorization": f"Bearer {reg.api_key}"}
                    )
                    if r.status_code == 200:
                        data = r.json().get("data", {})
                        stat_item["credits"] = {
                            "limit": data.get("limit"),
                            "usage": data.get("usage"),
                            "remaining": (data.get("limit") or 0) - (data.get("usage") or 0),
                            "is_free": data.get("is_free")
                        }
            except Exception:
                pass
                
        model_stats.append(stat_item)
        
    return model_stats

@app.post("/api/admin/db-test")
async def test_db_connection(body: dict = Body(...)):
    url = body.get("url", "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="Database URL required")
    try:
        test_engine = create_engine(url, pool_timeout=5)
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        test_engine.dispose()
        return {"status": "ok", "message": "Connection successful"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
