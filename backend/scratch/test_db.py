import psycopg2
import sys

try:
    # Connect to the default 'postgres' database to list others
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="saikumar@2001",
        host="localhost",
        port="5432"
    )
    print("Successfully connected to PostgreSQL server!")
    
    cur = conn.cursor()
    cur.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
    databases = cur.fetchall()
    print("\nAvailable databases:")
    for db in databases:
        print(f"- {db[0]}")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
