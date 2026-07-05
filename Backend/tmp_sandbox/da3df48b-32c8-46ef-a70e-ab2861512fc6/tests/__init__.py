import pytest
from app import create_app
from app.config import Config

@pytest.fixture
def client():
    app = create_app(Config)
    app.config['TESTING'] = True
    client = app.test_client()
    yield client
    # no need to do anything here
