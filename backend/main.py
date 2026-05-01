from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from . import models, database, ollama_client
from pydantic import BaseModel

app = FastAPI(title="Graviton AI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
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

class ChatResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str

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
    messages = body.get("messages", [])
    model = body.get("model", "llama3")
    
    # In a real app, you might want to save the user message to DB here
    # For now, we'll just stream the response
    
    async def generate():
        full_response = ""
        async for chunk in ollama_client.chat_with_ollama(model, messages):
            full_response += chunk
            yield chunk
        
        # After streaming completes, you could save the assistant message to DB
        # This requires passing more context (like chat_id) in the request body
    
    return StreamingResponse(generate(), media_type="text/plain")

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
