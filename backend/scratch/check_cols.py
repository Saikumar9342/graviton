
import sys
import os
from sqlalchemy import inspect

# Add the current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine

def check_columns():
    inspector = inspect(engine)
    for table in ["registered_models", "messages", "chats"]:
        try:
            cols = [c["name"] for c in inspector.get_columns(table)]
            print(f"Table '{table}': {cols}")
        except Exception as e:
            print(f"Error checking table '{table}': {e}")

if __name__ == "__main__":
    check_columns()
