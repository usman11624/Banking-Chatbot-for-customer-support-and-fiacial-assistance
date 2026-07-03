import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from app.db import init_db

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    with app.app_context():
        init_db()

    from app.routes.auth import auth_bp
    from app.routes.accounts import accounts_bp
    from app.routes.loans import loans_bp
    from app.routes.fraud import fraud_bp
    from app.routes.chat import chat_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(accounts_bp)
    app.register_blueprint(loans_bp)
    app.register_blueprint(fraud_bp)
    app.register_blueprint(chat_bp)

    return app
