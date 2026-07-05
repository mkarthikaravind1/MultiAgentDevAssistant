import pytest
from app import create_app
from app.models.borrower import Borrower
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

def test_create_borrower(client):
    borrower_data = {'name': 'John Doe', 'email': 'john@example.com'}
    response = client.post('/borrowers', json=borrower_data)
    assert response.status_code == 201
    assert response.json['name'] == borrower_data['name']
    assert response.json['email'] == borrower_data['email']

def test_get_borrower(client):
    borrower_data = {'name': 'John Doe', 'email': 'john@example.com'}
    client.post('/borrowers', json=borrower_data)
    response = client.get('/borrowers/1')
    assert response.status_code == 200
    assert response.json['name'] == borrower_data['name']
    assert response.json['email'] == borrower_data['email']

def test_update_borrower(client):
    borrower_data = {'name': 'John Doe', 'email': 'john@example.com'}
    client.post('/borrowers', json=borrower_data)
    updated_borrower_data = {'name': 'Jane Doe', 'email': 'jane@example.com'}
    response = client.put('/borrowers/1', json=updated_borrower_data)
    assert response.status_code == 200
    assert response.json['name'] == updated_borrower_data['name']
    assert response.json['email'] == updated_borrower_data['email']

def test_delete_borrower(client):
    borrower_data = {'name': 'John Doe', 'email': 'john@example.com'}
    client.post('/borrowers', json=borrower_data)
    response = client.delete('/borrowers/1')
    assert response.status_code == 204
