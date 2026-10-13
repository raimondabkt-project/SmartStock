import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-jwt-secret-key')

    # Menggunakan variabel terpisah yang disediakan langsung oleh Railway MySQL
    DB_USER = os.getenv('MYSQLUSER') or os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('MYSQLPASSWORD') or os.getenv('DB_PASSWORD', '')
    DB_HOST = os.getenv('MYSQLHOST') or os.getenv('DB_HOST', '127.0.0.1')
    DB_PORT = os.getenv('MYSQLPORT') or os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('MYSQLDATABASE') or os.getenv('DB_NAME', 'smartstock_db')

    # Format URI SQLAlchemy untuk PyMySQL
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    ELASTICSEARCH_URL = os.getenv('ELASTICSEARCH_URL', 'http://localhost:9200')