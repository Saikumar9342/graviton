
import sys
import os

# Add the current directory to sys.path so we can import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def check_metadata():
    db = SessionLocal()
    try:
        leaked = db.query(models.Message).filter(models.Message.content.contains("__USAGE__")).all()
        print(f"Found {len(leaked)} messages with leaked metadata.")
        for msg in leaked[:5]:
            print(f"ID: {msg.id}")
            print(f"Content snippet: {msg.content[-100:]}")
            print("-" * 20)
            
        chats_with_bad_titles = db.query(models.Chat).filter(models.Chat.title.contains("__USAGE__")).all()
        print(f"Found {len(chats_with_bad_titles)} chats with leaked metadata in titles.")
        for chat in chats_with_bad_titles[:5]:
            print(f"Chat ID: {chat.id}")
            print(f"Title: {chat.title}")
            print("-" * 20)
            
    finally:
        db.close()

if __name__ == "__main__":
    check_metadata()
