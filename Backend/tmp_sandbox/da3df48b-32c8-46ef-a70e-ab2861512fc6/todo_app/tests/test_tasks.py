from fastapi.testclient import TestClient
from todo_app.main import app
from todo_app.database import SessionLocal
from todo_app.models import Task

client = TestClient(app)

def test_create_task():
    db = SessionLocal()
    task = Task(title='Test Task', description='Test Description')
    db.add(task)
    db.commit()
    db.refresh(task)
    response = client.post('/tasks/', json={'title': 'Test Task', 'description': 'Test Description'})
    assert response.status_code == 200
    assert response.json()['title'] == 'Test Task'
    assert response.json()['description'] == 'Test Description'

def test_read_tasks():
    db = SessionLocal()
    task = Task(title='Test Task', description='Test Description')
    db.add(task)
    db.commit()
    db.refresh(task)
    response = client.get('/tasks/')
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['title'] == 'Test Task'
    assert response.json()[0]['description'] == 'Test Description'