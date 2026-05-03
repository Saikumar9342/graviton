import sys
import os
from sqlalchemy import text, inspect

# Add the current directory to sys.path to import local modules
sys.path.append(os.getcwd())

import database

def run_migration():
    print(f"Connecting to: {database.SQLALCHEMY_DATABASE_URL}")
    try:
        inspector = inspect(database.engine)
        columns = [c['name'] for c in inspector.get_columns('registered_models')]
        print(f"Current columns: {columns}")

        with database.engine.connect() as conn:
            # 1. Add api_base_url
            if 'api_base_url' not in columns:
                print("Adding api_base_url...")
                conn.execute(text("ALTER TABLE registered_models ADD COLUMN api_base_url VARCHAR"))
                conn.commit()
                print("Added api_base_url.")
            
            # 2. Add api_key
            if 'api_key' not in columns:
                print("Adding api_key...")
                conn.execute(text("ALTER TABLE registered_models ADD COLUMN api_key VARCHAR"))
                conn.commit()
                print("Added api_key.")
            
            # 3. Add provider if missing (should be there based on inspection but let's be safe)
            if 'provider' not in columns:
                print("Adding provider...")
                conn.execute(text("ALTER TABLE registered_models ADD COLUMN provider VARCHAR DEFAULT 'ollama' NOT NULL"))
                conn.commit()
                print("Added provider.")
            
            # 4. Fix existing cloud models
            print("Updating provider for cloud models...")
            # We assume llama-3.3-70b-versatile is always Groq/Cloud
            conn.execute(text("UPDATE registered_models SET provider = 'openai-compat' WHERE ollama_name = 'llama-3.3-70b-versatile'"))
            conn.commit()
            print("Updated llama-3.3-70b-versatile to openai-compat.")

            # IMPORTANT: We need to set the api_base_url for it to work!
            conn.execute(text("UPDATE registered_models SET api_base_url = 'https://api.groq.com/openai/v1' WHERE ollama_name = 'llama-3.3-70b-versatile' AND api_base_url IS NULL"))
            conn.commit()
            print("Set default Groq URL for llama-3.3-70b-versatile.")

        print("Migration and data fix complete.")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    run_migration()
