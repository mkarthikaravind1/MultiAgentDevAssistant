from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.author import Author
from app.services.database import db

author_blueprint = Blueprint('author', __name__)

@author_blueprint.route('/authors', methods=['GET'])
@jwt_required()
def get_all_authors():
    authors = Author.query.all()
    return jsonify([author.to_dict() for author in authors])

@author_blueprint.route('/authors', methods=['POST'])
@jwt_required()
def create_author():
    data = request.get_json()
    author = Author(name=data['name'])
    db.session.add(author)
    db.session.commit()
    return jsonify(author.to_dict()), 201

@author_blueprint.route('/authors/<int:author_id>', methods=['GET'])
@jwt_required()
def get_author(author_id):
    author = Author.query.get(author_id)
    if author:
        return jsonify(author.to_dict())
    return jsonify({'message': 'Author not found'}), 404

@author_blueprint.route('/authors/<int:author_id>', methods=['PUT'])
@jwt_required()
def update_author(author_id):
    author = Author.query.get(author_id)
    if author:
        data = request.get_json()
        author.name = data['name']
        db.session.commit()
        return jsonify(author.to_dict())
    return jsonify({'message': 'Author not found'}), 404

@author_blueprint.route('/authors/<int:author_id>', methods=['DELETE'])
@jwt_required()
def delete_author(author_id):
    author = Author.query.get(author_id)
    if author:
        db.session.delete(author)
        db.session.commit()
        return jsonify({'message': 'Author deleted'})
    return jsonify({'message': 'Author not found'}), 404
