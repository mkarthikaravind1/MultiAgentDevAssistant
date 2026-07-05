from fastapi.testclient import TestClient
from todo_app.main import app
from todo_app.database import SessionLocal
from todo_app.models import User

client = TestClient(app)

def test_create_user():
    db = SessionLocal()
    user = User(username='Test User', email='test@example.com')
    db.add(user)
    db.commit()
    db.refresh(user)
    response = client.post('/users/', json={'username': 'Test User', 'email': 'test@example.com'})
    assert response.status_code == 200
    assert response.json()['username'] == 'Test User'
    assert response.json()['email'] == 'test@example.com'

def test_read_users():
    db = SessionLocal()
    user = User(username='Test User', email='test@example.com')
    db.add(user)
    db.commit()
    db.refresh(user)
    response = client.get('/users/')
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['username'] == 'Test User'
    assert response.json()[0]['email'] == 'test@example.com'