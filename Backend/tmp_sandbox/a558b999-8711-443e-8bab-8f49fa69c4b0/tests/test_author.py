import pytest
from app import create_app
from app.models import db, Author
from app.routes.author import author_blueprint

@pytest.fixture
def app():
    app = create_app()
    app.register_blueprint(author_blueprint)
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_get_all_authors(client):
    # Create a test author
    author = Author(name='Test Author', bio='Test Bio')
    with app.app_context():
        db.session.add(author)
        db.session.commit()
    # Test the GET /authors endpoint
    response = client.get('/authors')
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['name'] == 'Test Author'
    assert response.json[0]['bio'] == 'Test Bio'

def test_get_author_by_id(client):
    # Create a test author
    author = Author(name='Test Author', bio='Test Bio')
    with app.app_context():
        db.session.add(author)
        db.session.commit()
    # Test the GET /authors/:id endpoint
    response = client.get(f'/authors/{author.id}')
    assert response.status_code == 200
    assert response.json['name'] == 'Test Author'
    assert response.json['bio'] == 'Test Bio'

def test_create_author(client):
    # Test the POST /authors endpoint
    response = client.post('/authors', json={'name': 'New Author', 'bio': 'New Bio'})
    assert response.status_code == 201
    assert response.json['name'] == 'New Author'
    assert response.json['bio'] == 'New Bio'

def test_update_author(client):
    # Create a test author
    author = Author(name='Test Author', bio='Test Bio')
    with app.app_context():
        db.session.add(author)
        db.session.commit()
    # Test the PUT /authors/:id endpoint
    response = client.put(f'/authors/{author.id}', json={'name': 'Updated Author', 'bio': 'Updated Bio'})
    assert response.status_code == 200
    assert response.json['name'] == 'Updated Author'
    assert response.json['bio'] == 'Updated Bio'

def test_delete_author(client):
    # Create a test author
    author = Author(name='Test Author', bio='Test Bio')
    with app.app_context():
        db.session.add(author)
        db.session.commit()
    # Test the DELETE /authors/:id endpoint
    response = client.delete(f'/authors/{author.id}')
    assert response.status_code == 204
