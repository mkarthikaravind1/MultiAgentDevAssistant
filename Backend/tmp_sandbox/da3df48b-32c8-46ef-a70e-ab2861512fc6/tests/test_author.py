import pytest
from app import create_app
from app.models.author import Author
from app.services.database import db
from flask_jwt_extended import create_access_token

@pytest.fixture
def client():
    app = create_app('testing')
    app.config['TESTING'] = True
    with app.app_context():
        db.create_all()
    yield app.test_client()
    with app.app_context():
        db.session.remove()
        db.drop_all()

def test_create_author(client):
    access_token = create_access_token(identity='test_user')
    headers = {'Authorization': f'Bearer {access_token}'}
    data = {'name': 'Test Author', 'bio': 'Test Bio'}
    response = client.post('/authors', json=data, headers=headers)
    assert response.status_code == 201
    assert response.json['name'] == 'Test Author'
    assert response.json['bio'] == 'Test Bio'

def test_get_all_authors(client):
    access_token = create_access_token(identity='test_user')
    headers = {'Authorization': f'Bearer {access_token}'}
    author1 = Author(name='Test Author 1', bio='Test Bio 1')
    author2 = Author(name='Test Author 2', bio='Test Bio 2')
    with client.app_context():
        db.session.add(author1)
        db.session.add(author2)
        db.session.commit()
    response = client.get('/authors', headers=headers)
    assert response.status_code == 200
    assert len(response.json) == 2

def test_get_author_by_id(client):
    access_token = create_access_token(identity='test_user')
    headers = {'Authorization': f'Bearer {access_token}'}
    author = Author(name='Test Author', bio='Test Bio')
    with client.app_context():
        db.session.add(author)
        db.session.commit()
    response = client.get(f'/authors/{author.id}', headers=headers)
    assert response.status_code == 200
    assert response.json['name'] == 'Test Author'
    assert response.json['bio'] == 'Test Bio'

def test_update_author(client):
    access_token = create_access_token(identity='test_user')
    headers = {'Authorization': f'Bearer {access_token}'}
    author = Author(name='Test Author', bio='Test Bio')
    with client.app_context():
        db.session.add(author)
        db.session.commit()
    data = {'name': 'Updated Test Author', 'bio': 'Updated Test Bio'}
    response = client.put(f'/authors/{author.id}', json=data, headers=headers)
    assert response.status_code == 200
    assert response.json['name'] == 'Updated Test Author'
    assert response.json['bio'] == 'Updated Test Bio'

def test_delete_author(client):
    access_token = create_access_token(identity='test_user')
    headers = {'Authorization': f'Bearer {access_token}'}
    author = Author(name='Test Author', bio='Test Bio')
    with client.app_context():
        db.session.add(author)
        db.session.commit()
    response = client.delete(f'/authors/{author.id}', headers=headers)
    assert response.status_code == 204
    with client.app_context():
        assert db.session.query(Author).filter_by(id=author.id).first() is None