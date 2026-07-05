from flask import Blueprint
from .book import book_blueprint
from .author import author_blueprint
from .borrower import borrower_blueprint

routes = [
    book_blueprint,
    author_blueprint,
    borrower_blueprint
]