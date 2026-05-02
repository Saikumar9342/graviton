from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os

import models, database, ollama_client
from pydantic import BaseModel

app = FastAPI(title="Graviton AI API")

# Create database tables
try:
    models.Base.metadata.create_all(bind=database.engine)
    print("Database tables created successfully.")
except Exception as e:
    print(f"Warning: Could not connect to database. {e}")
    print("Backend will continue to run, but database features will be unavailable.")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas
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

# Endpoints
@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/models")
async def list_models():
    models_list = await ollama_client.get_ollama_models()
    return {"models": models_list}

@app.post("/api/chat")
async def chat_endpoint(
    body: dict = Body(...),
    db: Session = Depends(database.get_db)
):
    messages_data = body.get("messages", [])
    model = body.get("model", "llama3")
    chat_id = body.get("chatId")
    system_prompt = body.get("systemPrompt", "")

    if not messages_data:
        raise HTTPException(status_code=400, detail="No messages provided")

    # Save user message if chat_id is provided
    if chat_id:
        user_msg = messages_data[-1]
        db_msg = models.Message(
            chat_id=chat_id,
            role=user_msg["role"],
            content=user_msg.get("content", "") or next((p["text"] for p in user_msg.get("parts", []) if p["type"] == "text"), "")
        )
        db.add(db_msg)
        db.commit()

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
            with database.SessionLocal() as session:
                assistant_msg = models.Message(
                    chat_id=chat_id,
                    role="assistant",
                    content=full_response
                )
                session.add(assistant_msg)
                db_chat = session.query(models.Chat).filter(models.Chat.id == chat_id).first()
                if db_chat:
                    db_chat.updated_at = datetime.utcnow()
                session.commit()

    return StreamingResponse(generate(), media_type="text/plain")

@app.get("/api/chats/{chat_id}/messages", response_model=List[MessageResponse])
def get_chat_messages(chat_id: str, db: Session = Depends(database.get_db)):
    messages = db.query(models.Message).filter(models.Message.chat_id == chat_id).order_by(models.Message.created_at.asc()).all()
    return messages

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

@app.delete("/api/chats/{chat_id}")
def delete_chat(chat_id: str, db: Session = Depends(database.get_db)):
    db_chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not db_chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    db.delete(db_chat)
    db.commit()
    return {"message": "Chat deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
