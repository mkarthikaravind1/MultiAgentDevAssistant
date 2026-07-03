import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.database import engine, SessionLocal
from app.models import Book

client = TestClient(app)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_create_book(db):
    book = Book(title='Test Book', author_id=1, genre_id=1)
    db.add(book)
    db.commit()
    db.refresh(book)
    response = client.post('/books/', json={'title': 'Test Book', 'author_id': 1, 'genre_id': 1})
    assert response.status_code == 200
    assert response.json()['title'] == 'Test Book'
