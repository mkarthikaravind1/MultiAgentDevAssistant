from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class Author(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    books = db.relationship('Book', backref='author', lazy=True)

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f'Author({self.name})'

    @property
    def serialize(self):
        return {
            'id': self.id,
            'name': self.name
        }
