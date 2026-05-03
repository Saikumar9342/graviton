import sys
import os
from sqlalchemy import text

# Add the current directory to sys.path
sys.path.append(os.getcwd())

import database

def run_test_migration():
    print(f"Connecting to: {database.SQLALCHEMY_DATABASE_URL}")
    try:
        with database.engine.connect() as conn:
            print("Trying to add updated_at column...")
            ddl = "ALTER TABLE registered_models ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"
            try:
                conn.execute(text(ddl))
                conn.commit()
                print("SUCCESS: Added updated_at")
            except Exception as e:
                print(f"FIRST ATTEMPT FAILED: {e}")
                
                print("Trying fallback to TIMESTAMP...")
                fallback_ddl = "ALTER TABLE registered_models ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                try:
                    conn.execute(text(fallback_ddl))
                    conn.commit()
                    print("SUCCESS: Added updated_at (TIMESTAMP)")
                except Exception as e2:
                    print(f"SECOND ATTEMPT FAILED: {e2}")
                    
    except Exception as e:
        print(f"CONNECTION ERROR: {e}")

if __name__ == "__main__":
    run_test_migration()
