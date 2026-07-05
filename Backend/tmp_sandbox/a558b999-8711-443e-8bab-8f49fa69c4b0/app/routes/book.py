from flask import Blueprint, request, jsonify
from app.models.book import Book
from app.services.database import db_session
from app.utils.helpers import validate_request_data

book_blueprint = Blueprint('book', __name__)

@book_blueprint.route('/books', methods=['GET'])
def get_all_books():
    books = db_session.query(Book).all()
    return jsonify([book.to_dict() for book in books])

@book_blueprint.route('/books', methods=['POST'])
def create_book():
    data = validate_request_data(request.json, ['title', 'author_id'])
    if data:
        book = Book(title=data['title'], author_id=data['author_id'])
        db_session.add(book)
        db_session.commit()
        return jsonify(book.to_dict()), 201
    return jsonify({'error': 'Invalid request data'}), 400

@book_blueprint.route('/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    book = db_session.query(Book).filter_by(id=book_id).first()
    if book:
        return jsonify(book.to_dict())
    return jsonify({'error': 'Book not found'}), 404

@book_blueprint.route('/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    book = db_session.query(Book).filter_by(id=book_id).first()
    if book:
        data = validate_request_data(request.json, ['title', 'author_id'])
        if data:
            book.title = data['title']
            book.author_id = data['author_id']
            db_session.commit()
            return jsonify(book.to_dict())
        return jsonify({'error': 'Invalid request data'}), 400
    return jsonify({'error': 'Book not found'}), 404

@book_blueprint.route('/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    book = db_session.query(Book).filter_by(id=book_id).first()
    if book:
        db_session.delete(book)
        db_session.commit()
        return jsonify({'message': 'Book deleted successfully'}), 200
    return jsonify({'error': 'Book not found'}), 404