from flask_sqlalchemy import SQLAlchemy
from app import db
from datetime import datetime

class Author(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    birth_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    books = db.relationship('Book', backref='author', lazy=True)

    def __repr__(self):
        return f'Author({self.name}, {self.birth_date})'

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'birth_date': self.birth_date}
