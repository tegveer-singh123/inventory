import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401 — registers all models with Base.metadata
from app.core.database import get_db
from app.main import app

# Always use the real PostgreSQL — no SQLite fallback.
# When running via `make test` / `docker compose exec backend pytest`,
# DATABASE_URL is already set in the container environment.
DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Tables to truncate between tests (order matters: children before parents)
_TRUNCATE_SQL = text(
    "TRUNCATE order_items, orders, products, customers RESTART IDENTITY CASCADE"
)


@pytest.fixture(autouse=True)
def clean_tables():
    """Wipe all data tables before every test so each test starts clean."""
    with engine.connect() as conn:
        conn.execute(_TRUNCATE_SQL)
        conn.commit()
    yield


@pytest.fixture
def client(clean_tables):
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
