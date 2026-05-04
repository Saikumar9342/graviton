import psycopg2
from urllib.parse import urlparse

db_url = "postgresql://postgres:saikumar%402001@localhost:5433/ai_chatbot"
p = urlparse(db_url)

try:
    conn = psycopg2.connect(
        dbname="postgres",
        user=p.username,
        password=p.password,
        host=p.hostname,
        port=p.port
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname='ai_chatbot'")
    exists = cur.fetchone()
    if not exists:
        print("DATABASE_NOT_FOUND")
    else:
        print("DATABASE_EXISTS")
    cur.close()
    conn.close()
except Exception as e:
    print(f"CONNECTION_FAILED: {e}")
