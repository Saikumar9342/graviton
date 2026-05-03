import sys
import os
from sqlalchemy import text

# Add the current directory to sys.path to import local modules
sys.path.append(os.getcwd())

import database

def run_migration():
    print("Connecting to database...")
    try:
        with database.engine.connect() as conn:
            print("Connected successfully.")
            for col, ddl in [
                ("provider",     "ALTER TABLE registered_models ADD COLUMN provider VARCHAR DEFAULT 'ollama' NOT NULL"),
                ("api_base_url", "ALTER TABLE registered_models ADD COLUMN api_base_url VARCHAR"),
                ("api_key",      "ALTER TABLE registered_models ADD COLUMN api_key VARCHAR"),
            ]:
                print(f"Adding column {col}...")
                try:
                    conn.execute(text(ddl))
                    conn.commit()
                    print(f"OK: Added column {col}")
                except Exception as e:
                    print(f"WARN: Failed to add {col} (might already exist): {e}")
            
    except Exception as e:
        print(f"ERROR: Connection failed: {e}")

if __name__ == "__main__":
    run_migration()
