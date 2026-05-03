
import sys
import os

# Add the current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
import json

def strip_usage_metadata(text: str) -> str:
    if not text:
        return text
    if "__USAGE__:" in text:
        return text.split("__USAGE__:")[0]
    return text

def cleanup_titles():
    db = SessionLocal()
    try:
        chats = db.query(models.Chat).filter(models.Chat.title.contains("__USAGE__")).all()
        print(f"Cleaning {len(chats)} chat titles...")
        for chat in chats:
            old_title = chat.title
            new_title = strip_usage_metadata(old_title).strip()
            # Also remove trailing quotes if any
            new_title = new_title.strip('"').strip("'").strip()
            
            if new_title != old_title:
                chat.title = new_title
                print(f"Updated: '{old_title}' -> '{new_title}'")
            else:
                print(f"No change for: '{old_title}'")
        
        db.commit()
        print("Cleanup complete.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_titles()
