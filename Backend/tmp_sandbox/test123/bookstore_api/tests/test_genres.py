import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.database import engine, SessionLocal
from app.models import Genre

client = TestClient(app)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_create_genre(db):
    genre = Genre(name='Test Genre')
    db.add(genre)
    db.commit()
    db.refresh(genre)
    response = client.post('/genres/', json={'name': 'Test Genre'})
    assert response.status_code == 200
    assert response.json()['name'] == 'Test Genre'
