import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import engine
from sqlalchemy import inspect

def inspect_db():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables: {tables}")
    for table in tables:
        columns = inspector.get_columns(table)
        print(f"Table: {table}")
        for col in columns:
            print(f"  Column: {col['name']} ({col['type']})")

if __name__ == "__main__":
    try:
        inspect_db()
    except Exception as e:
        print(f"Error: {e}")
