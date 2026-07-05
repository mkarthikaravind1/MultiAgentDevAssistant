from flask_sqlalchemy import SQLAlchemy
from app import db
from datetime import datetime

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('author.id'), nullable=False)
    author = db.relationship('Author', backref=db.backref('books', lazy=True))
    borrower_id = db.Column(db.Integer, db.ForeignKey('borrower.id'), nullable=True)
    borrower = db.relationship('Borrower', backref=db.backref('borrowed_books', lazy=True))
    borrowed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'Book({self.title}, {self.author.name})'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'author_id': self.author_id,
            'borrower_id': self.borrower_id,
            'borrowed': self.borrowed,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
