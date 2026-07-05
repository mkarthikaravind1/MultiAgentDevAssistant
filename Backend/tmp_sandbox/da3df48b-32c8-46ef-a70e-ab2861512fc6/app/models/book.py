from flask_sqlalchemy import SQLAlchemy
from app import db
from datetime import datetime
from app.models.author import Author
from app.models.borrower import Borrower

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    publication_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    author_id = db.Column(db.Integer, db.ForeignKey('author.id'), nullable=False)
    author = db.relationship('Author', backref=db.backref('books', lazy=True))
    borrower_id = db.Column(db.Integer, db.ForeignKey('borrower.id'), nullable=True)
    borrower = db.relationship('Borrower', backref=db.backref('borrowed_books', lazy=True))

    def __repr__(self):
        return f'Book({self.title}, {self.author.name})'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'publication_date': self.publication_date,
            'author_id': self.author_id,
            'author_name': self.author.name,
            'borrower_id': self.borrower_id
        }
