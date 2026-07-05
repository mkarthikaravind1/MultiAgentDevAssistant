from flask import request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from app.config import JWT_SECRET_KEY
from app.models.author import Author
from app.models.borrower import Borrower
from app.services.database import db

# Create a new access token for a user
def create_token(user_id, user_type):
    access_token = create_access_token(identity={'user_id': user_id, 'user_type': user_type})
    return access_token

# Authenticate a user and return an access token
def authenticate_user(username, password, user_type):
    if user_type == 'author':
        user = Author.query.filter_by(username=username).first()
    elif user_type == 'borrower':
        user = Borrower.query.filter_by(username=username).first()
    else:
        return None

    if user and user.check_password(password):
        access_token = create_token(user.id, user_type)
        return access_token
    else:
        return None

# Get the current user's identity
def get_current_user_identity():
    current_user = get_jwt_identity()
    return current_user

# Verify if a user is authenticated
def is_authenticated():
    try:
        get_jwt_identity()
        return True
    except Exception as e:
        return False

# Require authentication for a route
def require_auth(func):
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'msg': 'Missing Authorization Header'}), 401
        return func(*args, **kwargs)
    return decorated_function