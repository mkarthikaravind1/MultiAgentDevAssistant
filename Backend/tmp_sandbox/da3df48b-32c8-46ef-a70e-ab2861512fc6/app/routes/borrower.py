from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.borrower import Borrower
from app.services.database import db

borrower_blueprint = Blueprint('borrower', __name__)

@borrower_blueprint.route('/borrowers', methods=['GET'])
@jwt_required()
def get_all_borrowers():
    borrowers = Borrower.query.all()
    return jsonify([borrower.to_dict() for borrower in borrowers])

@borrower_blueprint.route('/borrowers', methods=['POST'])
@jwt_required()
def create_borrower():
    data = request.get_json()
    borrower = Borrower(name=data['name'], email=data['email'])
    db.session.add(borrower)
    db.session.commit()
    return jsonify(borrower.to_dict()), 201

@borrower_blueprint.route('/borrowers/<int:borrower_id>', methods=['GET'])
@jwt_required()
def get_borrower(borrower_id):
    borrower = Borrower.query.get(borrower_id)
    if borrower is None:
        return jsonify({'message': 'Borrower not found'}), 404
    return jsonify(borrower.to_dict())

@borrower_blueprint.route('/borrowers/<int:borrower_id>', methods=['PUT'])
@jwt_required()
def update_borrower(borrower_id):
    borrower = Borrower.query.get(borrower_id)
    if borrower is None:
        return jsonify({'message': 'Borrower not found'}), 404
    data = request.get_json()
    borrower.name = data['name']
    borrower.email = data['email']
    db.session.commit()
    return jsonify(borrower.to_dict())

@borrower_blueprint.route('/borrowers/<int:borrower_id>', methods=['DELETE'])
@jwt_required()
def delete_borrower(borrower_id):
    borrower = Borrower.query.get(borrower_id)
    if borrower is None:
        return jsonify({'message': 'Borrower not found'}), 404
    db.session.delete(borrower)
    db.session.commit()
    return jsonify({'message': 'Borrower deleted'})
