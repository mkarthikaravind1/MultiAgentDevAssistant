import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.database import engine, SessionLocal
from app.models import Author

client = TestClient(app)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_create_author(db):
    author = Author(name='Test Author')
    db.add(author)
    db.commit()
    db.refresh(author)
    response = client.post('/authors/', json={'name': 'Test Author'})
    assert response.status_code == 200
    assert response.json()['name'] == 'Test Author'
