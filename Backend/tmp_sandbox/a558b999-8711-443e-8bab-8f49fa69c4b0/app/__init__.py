from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import Config

db = SQLAlchemy()
login_manager = LoginManager()

login_manager.login_view = 'login'

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    login_manager.init_app(app)

    from app.routes.book import book
    from app.routes.author import author
    from app.routes.borrower import borrower

    app.register_blueprint(book)
    app.register_blueprint(author)
    app.register_blueprint(borrower)

    return app