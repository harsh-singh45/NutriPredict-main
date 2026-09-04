"""
SQLAlchemy engine + session setup.

Uses the classic sync SQLAlchemy 2.0 style (psycopg2 driver). This keeps the
mental model simple — one request, one session, no event-loop gotchas — which
is the right tradeoff for a team that's about to be heads-down on the model
integration rather than async internals. Swap to an async engine later if a
specific endpoint genuinely needs it.
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, future=True)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
