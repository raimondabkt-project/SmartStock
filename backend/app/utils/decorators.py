from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt

def admin_required():
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get('role') != 'admin':
                return jsonify({'message': 'Akses ditolak! Hanya Admin yang diizinkan.'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator