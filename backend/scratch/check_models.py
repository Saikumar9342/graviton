import sys
import os

# Add the current directory to sys.path to import local modules
sys.path.append(os.getcwd())

import database
import models

def list_models():
    with database.SessionLocal() as db:
        registered = db.query(models.RegisteredModel).all()
        print(f"Total registered models: {len(registered)}")
        for m in registered:
            print(f"ID: {m.id} | Name: {m.ollama_name} | Provider: {m.provider} | Active: {m.is_active} | Has Key: {bool(m.api_key)}")

if __name__ == "__main__":
    list_models()
