from flask import Blueprint, request, jsonify
from app.models.borrower import Borrower
from app.services.database import db
from app.utils.helpers import validate_request_data

borrower_blueprint = Blueprint('borrower', __name__)

@borrower_blueprint.route('/borrowers', methods=['GET'])
def get_all_borrowers():
    borrowers = Borrower.query.all()
    return jsonify([borrower.to_dict() for borrower in borrowers])

@borrower_blueprint.route('/borrowers', methods=['POST'])
def create_borrower():
    data = request.get_json()
    if not validate_request_data(data, ['name', 'email']):
        return jsonify({'error': 'Invalid request data'}), 400
    borrower = Borrower(name=data['name'], email=data['email'])
    db.session.add(borrower)
    db.session.commit()
    return jsonify(borrower.to_dict()), 201

@borrower_blueprint.route('/borrowers/<int:borrower_id>', methods=['GET'])
def get_borrower(borrower_id):
    borrower = Borrower.query.get(borrower_id)
    if borrower is None:
        return jsonify({'error': 'Borrower not found'}), 404
    return jsonify(borrower.to_dict())

@borrower_blueprint.route('/borrowers/<int:borrower_id>', methods=['PUT'])
def update_borrower(borrower_id):
    borrower = Borrower.query.get(borrower_id)
    if borrower is None:
        return jsonify({'error': 'Borrower not found'}), 404
    data = request.get_json()
    if 'name' in data:
        borrower.name = data['name']
    if 'email' in data:
        borrower.email = data['email']
    db.session.commit()
    return jsonify(borrower.to_dict())

@borrower_blueprint.route('/borrowers/<int:borrower_id>', methods=['DELETE'])
def delete_borrower(borrower_id):
    borrower = Borrower.query.get(borrower_id)
    if borrower is None:
        return jsonify({'error': 'Borrower not found'}), 404
    db.session.delete(borrower)
    db.session.commit()
    return jsonify({'message': 'Borrower deleted successfully'})