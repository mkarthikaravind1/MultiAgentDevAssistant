from flask_sqlalchemy import SQLAlchemy
from app import db
from datetime import datetime

class Borrower(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    borrowed_books = db.relationship('Book', backref='borrower', lazy=True)

    def __init__(self, name, email, phone_number):
        self.name = name
        self.email = email
        self.phone_number = phone_number

    def __repr__(self):
        return f'Borrower({self.name}, {self.email}, {self.phone_number})'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone_number': self.phone_number
        }

    def save(self):
        db.session.add(self)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def get_all_borrowers():
        return Borrower.query.all()

    @staticmethod
    def get_borrower_by_id(id):
        return Borrower.query.get(id)

    @staticmethod
    def get_borrower_by_email(email):
        return Borrower.query.filter_by(email=email).first()