from fastapi import FastAPI, Depends, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, create_engine
from typing import List, Optional, AsyncGenerator
from datetime import datetime
import os
import httpx
import json
import uuid
from pathlib import Path

import models, database, ollama_client
from pydantic import BaseModel, ConfigDict

app = FastAPI(title="Graviton AI API")

try:
    models.Base.metadata.create_all(bind=database.engine)
    print("Database tables created successfully.")
except Exception as e:
    print(f"Warning: Could not connect to database. {e}")

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

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# ── Pydantic schemas ────────────────────────────────────────────────────────

class MessageSchema(BaseModel):
    role: str
    content: str

class ChatCreate(BaseModel):
    title: str

class ChatUpdate(BaseModel):
    title: Optional[str] = None

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    role: str
    content: str
    created_at: datetime

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

# ── Models ──────────────────────────────────────────────────────────────────

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

async def _stream_openai(model: str, messages: list, api_key: str) -> AsyncGenerator[str, None]:
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST",
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": messages, "stream": True},
        ) as r:
            if r.status_code != 200:
                err = await r.aread()
                raise Exception(f"OpenAI error: {err.decode()}")
            async for line in r.aiter_lines():
                if line.startswith("data: ") and "[DONE]" not in line:
                    try:
                        delta = json.loads(line[6:])["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta
                    except Exception:
                        pass

async def _stream_anthropic(model: str, messages: list, api_key: str) -> AsyncGenerator[str, None]:
    system = ""
    msg_list = []
    for m in messages:
        if m["role"] == "system":
            system = m["content"]
        else:
            msg_list.append(m)

    payload: dict = {
        "model": model,
        "messages": msg_list,
        "max_tokens": 4096,
        "stream": True,
    }
    if system:
        payload["system"] = system

    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST",
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json=payload,
        ) as r:
            if r.status_code != 200:
                err = await r.aread()
                raise Exception(f"Anthropic error: {err.decode()}")
            async for line in r.aiter_lines():
                if line.startswith("data: "):
                    try:
                        data = json.loads(line[6:])
                        if data.get("type") == "content_block_delta":
                            yield data["delta"].get("text", "")
                    except Exception:
                        pass

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
    openai_key = body.get("openaiApiKey") or OPENAI_API_KEY
    anthropic_key = body.get("anthropicApiKey") or ANTHROPIC_API_KEY

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
            )
            db.add(db_msg)
            db.commit()
        except Exception as e:
            print(f"Warning: Could not save user message: {e}")

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

        try:
            if model.startswith("gpt-") or model.startswith("o1") or model.startswith("o3"):
                if not openai_key:
                    raise Exception("OpenAI API key not configured. Go to Settings → Providers.")
                async for chunk in _stream_openai(model, ollama_messages, openai_key):
                    full_response += chunk
                    yield chunk
            elif model.startswith("claude-"):
                if not anthropic_key:
                    raise Exception("Anthropic API key not configured. Go to Settings → Providers.")
                async for chunk in _stream_anthropic(model, ollama_messages, anthropic_key):
                    full_response += chunk
                    yield chunk
            else:
                async for chunk in ollama_client.chat_with_ollama(model, ollama_messages):
                    full_response += chunk
                    yield chunk
        except Exception as e:
            err = str(e)
            error_msg = (
                f"\n\n⚠️ Model '{model}' is not installed. Go to Settings → Models and pull it first."
                if "not found" in err.lower()
                else f"\n\n⚠️ {err}"
            )

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
                    )
                    session.add(assistant_msg)
                    db_chat = session.query(models.Chat).filter(models.Chat.id == chat_id).first()
                    if db_chat:
                        db_chat.updated_at = datetime.utcnow()
                    session.commit()
            except Exception as e:
                print(f"Warning: Could not save assistant message: {e}")

    return StreamingResponse(generate(), media_type="text/plain")

# ── Chats CRUD ──────────────────────────────────────────────────────────────

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
