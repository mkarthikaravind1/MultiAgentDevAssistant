from flask import Blueprint, request, jsonify
from app.models.author import Author
from app.services.database import db
from app.utils.helpers import validate_request_data

author_blueprint = Blueprint('author', __name__)

@author_blueprint.route('/authors', methods=['GET'])
def get_all_authors():
    authors = Author.query.all()
    return jsonify([author.to_dict() for author in authors])

@author_blueprint.route('/authors', methods=['POST'])
def create_author():
    data = request.json
    if not validate_request_data(data, ['name', 'birth_date']):
        return jsonify({'error': 'Invalid request data'}), 400
    author = Author(name=data['name'], birth_date=data['birth_date'])
    db.session.add(author)
    db.session.commit()
    return jsonify(author.to_dict()), 201

@author_blueprint.route('/authors/<int:author_id>', methods=['GET'])
def get_author(author_id):
    author = Author.query.get(author_id)
    if author is None:
        return jsonify({'error': 'Author not found'}), 404
    return jsonify(author.to_dict())

@author_blueprint.route('/authors/<int:author_id>', methods=['PUT'])
def update_author(author_id):
    author = Author.query.get(author_id)
    if author is None:
        return jsonify({'error': 'Author not found'}), 404
    data = request.json
    if 'name' in data:
        author.name = data['name']
    if 'birth_date' in data:
        author.birth_date = data['birth_date']
    db.session.commit()
    return jsonify(author.to_dict())

@author_blueprint.route('/authors/<int:author_id>', methods=['DELETE'])
def delete_author(author_id):
    author = Author.query.get(author_id)
    if author is None:
        return jsonify({'error': 'Author not found'}), 404
    db.session.delete(author)
    db.session.commit()
    return jsonify({'message': 'Author deleted successfully'}), 200