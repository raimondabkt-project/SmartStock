from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app import db
from app.models import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# 1. ENDPOINT REGISTER
@auth_bp.route('/register', methods=['POST'], strict_slashes=False)
def register():
    data = request.get_json(silent=True) or {}

    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Semua field (username, email, password) wajib diisi!'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username sudah digunakan!'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email sudah terdaftar!'}), 400

    # Menggunakan hashing default Werkzeug yang aman
    hashed_password = generate_password_hash(data['password'])
    
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_password,
        role=data.get('role', 'staff')  # Default role adalah 'staff'
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        'message': 'User berhasil mendaftar!', 
        'user': new_user.to_dict() if hasattr(new_user, 'to_dict') else {
            'id': new_user.id,
            'username': new_user.username,
            'email': new_user.email,
            'role': new_user.role
        }
    }), 201


# 2. ENDPOINT LOGIN
@auth_bp.route('/login', methods=['POST'], strict_slashes=False)
def login():
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    password = data.get('password')

    # 1. Validasi Input Kosong
    if not username or not password:
        return jsonify({'message': 'Username dan password wajib diisi!'}), 400

    # 2. Cari User di Database
    user = User.query.filter_by(username=username).first()

    # 3. Verifikasi User & Password
    if not user:
        return jsonify({'message': 'Username tidak ditemukan!'}), 401

    if not check_password_hash(user.password_hash, password):
        return jsonify({'message': 'Password salah!'}), 401

    # 4. Buat JWT Access Token (Sertakan Role)
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={'role': user.role}
    )

    # 5. Return Response (Lengkap dengan Status Code 200)
    return jsonify({
        'message': 'Login berhasil!',
        'token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'role': user.role
        }
    }), 200