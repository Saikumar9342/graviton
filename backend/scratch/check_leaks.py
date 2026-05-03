
import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add parent directory to sys.path to import from database and models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

def check_leaks():
    with engine.connect() as conn:
        print("Checking for __USAGE__ leaks...")
        
        # Check chats (titles)
        chats_query = text("SELECT id, title FROM chats WHERE title LIKE '%__USA%'")
        chats = conn.execute(chats_query).fetchall()
        print(f"Found {len(chats)} potential leaks in chat titles.")
        for chat in chats:
            print(f"Chat ID: {chat.id}, Title: {chat.title}")
            
        # Check messages (content)
        messages_query = text("SELECT id, content FROM messages WHERE content LIKE '%__USA%'")
        messages = conn.execute(messages_query).fetchall()
        print(f"Found {len(messages)} potential leaks in message contents.")
        for msg in messages:
            print(f"Message ID: {msg.id}, Content Snippet: {msg.content[-100:]}")

if __name__ == "__main__":
    check_leaks()
