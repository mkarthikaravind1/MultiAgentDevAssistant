from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.book import Book
from app.services.database import db

book_blueprint = Blueprint('book', __name__)

@book_blueprint.route('/books', methods=['GET'])
@jwt_required()
def get_all_books():
    books = Book.query.all()
    return jsonify([book.to_dict() for book in books])

@book_blueprint.route('/books', methods=['POST'])
@jwt_required()
def create_book():
    data = request.get_json()
    new_book = Book(title=data['title'], author_id=data['author_id'])
    db.session.add(new_book)
    db.session.commit()
    return jsonify(new_book.to_dict()), 201

@book_blueprint.route('/books/<int:book_id>', methods=['GET'])
@jwt_required()
def get_book(book_id):
    book = Book.query.get(book_id)
    if book is None:
        return jsonify({'message': 'Book not found'}), 404
    return jsonify(book.to_dict())

@book_blueprint.route('/books/<int:book_id>', methods=['PUT'])
@jwt_required()
def update_book(book_id):
    book = Book.query.get(book_id)
    if book is None:
        return jsonify({'message': 'Book not found'}), 404
    data = request.get_json()
    book.title = data['title']
    book.author_id = data['author_id']
    db.session.commit()
    return jsonify(book.to_dict())

@book_blueprint.route('/books/<int:book_id>', methods=['DELETE'])
@jwt_required()
def delete_book(book_id):
    book = Book.query.get(book_id)
    if book is None:
        return jsonify({'message': 'Book not found'}), 404
    db.session.delete(book)
    db.session.commit()
    return jsonify({'message': 'Book deleted'})
