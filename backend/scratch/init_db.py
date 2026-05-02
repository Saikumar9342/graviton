import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys

def create_database():
    try:
        # Connect to the default 'postgres' database
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="saikumar@2001",
            host="localhost",
            port="5432"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'graviton'")
        exists = cur.fetchone()
        
        if not exists:
            print("Creating database 'graviton'...")
            cur.execute("CREATE DATABASE graviton")
            print("Database 'graviton' created successfully!")
        else:
            print("Database 'graviton' already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_database()
