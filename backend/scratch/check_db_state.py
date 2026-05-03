import sys
import os
from sqlalchemy import inspect

# Add the current directory to sys.path
sys.path.append(os.getcwd())

import database

def check_db():
    print(f"Connecting to: {database.SQLALCHEMY_DATABASE_URL}")
    try:
        inspector = inspect(database.engine)
        if 'registered_models' not in inspector.get_table_names():
            print("Table 'registered_models' does not exist.")
            return

        cols = inspector.get_columns('registered_models')
        print("\nColumns in 'registered_models':")
        for c in cols:
            print(f"  {c['name']}: {c['type']}")

        if 'messages' in inspector.get_table_names():
            cols = inspector.get_columns('messages')
            print("\nColumns in 'messages':")
            for c in cols:
                print(f"  {c['name']}: {c['type']}")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check_db()
