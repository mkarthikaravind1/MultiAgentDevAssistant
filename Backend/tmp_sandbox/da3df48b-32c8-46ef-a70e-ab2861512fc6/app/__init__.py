from flask import Flask
from flask_jwt_extended import JWTManager
from app.config import Config
from app.services.database import db
from app.routes.book import book_blueprint
from app.routes.author import author_blueprint
from app.routes.borrower import borrower_blueprint

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
jwt = JWTManager(app)

app.register_blueprint(book_blueprint)
app.register_blueprint(author_blueprint)
app.register_blueprint(borrower_blueprint)

with app.app_context():
    db.create_all()