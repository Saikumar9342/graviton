from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, create_engine
from typing import List, Optional
from datetime import datetime
import os
import httpx
import json

import models, database, ollama_client
from pydantic import BaseModel

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

# ── Pydantic schemas ────────────────────────────────────────────────────────

class MessageSchema(BaseModel):
    role: str
    content: str

class ChatCreate(BaseModel):
    title: str

class ChatUpdate(BaseModel):
    title: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime
    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

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
        full_response = ""
        ollama_messages = []

        if system_prompt:
            ollama_messages.append({"role": "system", "content": system_prompt})

        for m in messages_data:
            content = m.get("content", "")
            if not content and "parts" in m:
                content = next((p["text"] for p in m["parts"] if p["type"] == "text"), "")
            ollama_messages.append({"role": m["role"], "content": content})

        async for chunk in ollama_client.chat_with_ollama(model, ollama_messages):
            full_response += chunk
            yield chunk

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
