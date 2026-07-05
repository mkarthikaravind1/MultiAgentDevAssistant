import pytest
from app import create_app
from app.models.book import Book
from app.services.database import db
import json

@pytest.fixture
def app():
    app = create_app('testing')
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@localhost/test_library'
    with app.app_context():
        db.create_all()
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

def test_create_book(client):
    book_data = {'title': 'Test Book', 'author_id': 1}
    response = client.post('/books', data=json.dumps(book_data), content_type='application/json')
    assert response.status_code == 201

def test_get_all_books(client):
    response = client.get('/books')
    assert response.status_code == 200

def test_get_book_by_id(client):
    book_data = {'title': 'Test Book', 'author_id': 1}
    response = client.post('/books', data=json.dumps(book_data), content_type='application/json')
    book_id = json.loads(response.data)['id']
    response = client.get(f'/books/{book_id}')
    assert response.status_code == 200

def test_update_book(client):
    book_data = {'title': 'Test Book', 'author_id': 1}
    response = client.post('/books', data=json.dumps(book_data), content_type='application/json')
    book_id = json.loads(response.data)['id']
    updated_book_data = {'title': 'Updated Test Book', 'author_id': 1}
    response = client.put(f'/books/{book_id}', data=json.dumps(updated_book_data), content_type='application/json')
    assert response.status_code == 200

def test_delete_book(client):
    book_data = {'title': 'Test Book', 'author_id': 1}
    response = client.post('/books', data=json.dumps(book_data), content_type='application/json')
    book_id = json.loads(response.data)['id']
    response = client.delete(f'/books/{book_id}')
    assert response.status_code == 204