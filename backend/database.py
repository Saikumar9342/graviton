import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/graviton")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_optional():
    """Returns a DB session if available, otherwise yields None gracefully."""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))  # quick connectivity check
        try:
            yield db
        finally:
            db.close()
    except Exception:
        yield None
