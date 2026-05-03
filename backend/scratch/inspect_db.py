import sys
import os
from sqlalchemy import text, inspect

# Add the current directory to sys.path to import local modules
sys.path.append(os.getcwd())

import database

def check_schema():
    print(f"Connecting to: {database.SQLALCHEMY_DATABASE_URL}")
    try:
        inspector = inspect(database.engine)
        tables = inspector.get_table_names()
        print(f"Tables: {tables}")
        
        if 'registered_models' in tables:
            columns = inspector.get_columns('registered_models')
            print("Columns in registered_models:")
            for col in columns:
                print(f" - {col['name']} ({col['type']})")
            
            with database.SessionLocal() as db:
                res = db.execute(text("SELECT * FROM registered_models"))
                rows = res.fetchall()
                print(f"Total rows: {len(rows)}")
                for row in rows:
                    print(row)
        else:
            print("Table registered_models not found!")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check_schema()
