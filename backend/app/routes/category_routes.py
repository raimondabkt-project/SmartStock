from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import Category

category_bp = Blueprint('category', __name__, url_prefix='/api/categories')

# Get All Categories
@category_bp.route('/', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories]), 200

# Create Category (Butuh JWT)
@category_bp.route('/', methods=['POST'])
@jwt_required()
def create_category():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'message': 'Nama kategori wajib diisi!'}), 400

    if Category.query.filter_by(name=data['name']).first():
        return jsonify({'message': 'Kategori sudah ada!'}), 400

    new_category = Category(
        name=data['name'],
        description=data.get('description', '')
    )
    db.session.add(new_category)
    db.session.commit()

    return jsonify({'message': 'Kategori berhasil dibuat!', 'category': new_category.to_dict()}), 201

# Update Category (Butuh JWT)
@category_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_category(id):
    category = Category.query.get_or_404(id)
    data = request.get_json()

    if 'name' in data:
        category.name = data['name']
    if 'description' in data:
        category.description = data['description']

    db.session.commit()
    return jsonify({'message': 'Kategori berhasil diperbarui!', 'category': category.to_dict()}), 200

# Delete Category (Butuh JWT)
@category_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_category(id):
    category = Category.query.get_or_404(id)
    
    # Cek apakah masih ada produk yang pakai kategori ini
    if category.products:
        return jsonify({'message': 'Tidak bisa menghapus kategori yang masih memiliki produk!'}), 400

    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Kategori berhasil dihapus!'}), 200