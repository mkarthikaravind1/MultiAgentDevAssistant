import pytest
from app import create_app
from app.models.borrower import Borrower
from app.services.database import db

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@localhost/test_db'
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_create_borrower(client):
    # Test creating a new borrower
    borrower_data = {'name': 'John Doe', 'email': 'john@example.com'}
    response = client.post('/borrowers', json=borrower_data)
    assert response.status_code == 201
    assert response.json['name'] == borrower_data['name']
    assert response.json['email'] == borrower_data['email']

def test_get_borrower(client):
    # Test getting a borrower by ID
    borrower_data = {'name': 'John Doe', 'email': 'john@example.com'}
    response = client.post('/borrowers', json=borrower_data)
    borrower_id = response.json['id']
    response = client.get(f'/borrowers/{borrower_id}')
    assert response.status_code == 200
    assert response.json['name'] == borrower_data['name']
    assert response.json['email'] == borrower_data['email']

def test_update_borrower(client):
    # Test updating a borrower
    borrower_data = {'name': 'John Doe', 'email': 'john@example.com'}
    response = client.post('/borrowers', json=borrower_data)
    borrower_id = response.json['id']
    updated_data = {'name': 'Jane Doe', 'email': 'jane@example.com'}
    response = client.put(f'/borrowers/{borrower_id}', json=updated_data)
    assert response.status_code == 200
    assert response.json['name'] == updated_data['name']
    assert response.json['email'] == updated_data['email']

def test_delete_borrower(client):
    # Test deleting a borrower
    borrower_data = {'name': 'John Doe', 'email': 'john@example.com'}
    response = client.post('/borrowers', json=borrower_data)
    borrower_id = response.json['id']
    response = client.delete(f'/borrowers/{borrower_id}')
    assert response.status_code == 204
