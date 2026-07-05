import pytest
from app import create_app
from app.models.book import Book
from app.services.database import db

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@localhost/test_library'
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_create_book(client):
    book_data = {'title': 'Test Book', 'author_id': 1}
    response = client.post('/books', json=book_data)
    assert response.status_code == 201
    assert response.json['title'] == book_data['title']

def test_get_book(client):
    book_data = {'title': 'Test Book', 'author_id': 1}
    client.post('/books', json=book_data)
    response = client.get('/books/1')
    assert response.status_code == 200
    assert response.json['title'] == book_data['title']

def test_update_book(client):
    book_data = {'title': 'Test Book', 'author_id': 1}
    client.post('/books', json=book_data)
    updated_book_data = {'title': 'Updated Test Book', 'author_id': 1}
    response = client.put('/books/1', json=updated_book_data)
    assert response.status_code == 200
    assert response.json['title'] == updated_book_data['title']

def test_delete_book(client):
    book_data = {'title': 'Test Book', 'author_id': 1}
    client.post('/books', json=book_data)
    response = client.delete('/books/1')
    assert response.status_code == 204
