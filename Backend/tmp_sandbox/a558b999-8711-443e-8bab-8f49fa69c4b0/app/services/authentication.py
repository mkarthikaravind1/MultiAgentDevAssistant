from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import User

login_manager = LoginManager()

class Authentication:
    def __init__(self, app):
        self.app = app
        self.login_manager = login_manager
        self.login_manager.init_app(self.app)
        self.login_manager.login_view = 'login'

    def login(self, username, password):
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return jsonify({'message': 'Logged in successfully'}), 200
        return jsonify({'message': 'Invalid username or password'}), 401

    def logout(self):
        logout_user()
        return jsonify({'message': 'Logged out successfully'}), 200

    def register(self, username, password):
        user = User.query.filter_by(username=username).first()
        if user:
            return jsonify({'message': 'Username already exists'}), 400
        new_user = User(username=username, password=generate_password_hash(password))
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User created successfully'}), 201

    def get_current_user(self):
        return current_user

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))