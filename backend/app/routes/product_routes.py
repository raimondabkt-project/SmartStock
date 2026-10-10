from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import Product, Category
from app.utils.decorators import admin_required
from app.routes.transaction_routes import StockTransaction

product_bp = Blueprint('product', __name__, url_prefix='/api/products')

# Get All Products
# @product_bp.route('/', methods=['GET'])
# def get_products():
#     products = Product.query.all()
#     return jsonify([p.to_dict() for p in products]), 200

# Create Product (Butuh JWT)
@product_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required()
def create_product():
    data = request.get_json()
    
    required_fields = ['name', 'sku', 'category_id', 'price', 'stock']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'message': 'Data produk tidak lengkap!'}), 400

    if Product.query.filter_by(sku=data['sku']).first():
        return jsonify({'message': 'SKU produk sudah digunakan!'}), 400

    category = Category.query.get(data['category_id'])
    if not category:
        return jsonify({'message': 'Kategori tidak ditemukan!'}), 404

    new_product = Product(
        name=data['name'],
        sku=data['sku'],
        category_id=data['category_id'],
        price=data['price'],
        stock=data['stock']
    )
    db.session.add(new_product)
    db.session.commit()

    return jsonify({'message': 'Produk berhasil ditambahkan!', 'product': new_product.to_dict()}), 201

# Get All Products (dengan Search & Filter Category)
@product_bp.route('/', methods=['GET'])
def get_products():
    search = request.args.get('search', '', type=str)
    category_id = request.args.get('category_id', type=int)

    query = Product.query

    # Filter pencarian berdasarkan Nama atau SKU
    if search:
        query = query.filter((Product.name.ilike(f'%{search}%')) | (Product.sku.ilike(f'%{search}%')))

    # Filter berdasarkan Category
    if category_id:
        query = query.filter_by(category_id=category_id)

    products = query.all()
    return jsonify([p.to_dict() for p in products]), 200

# Update Product (Butuh JWT)
@product_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required()
def update_product(id):
    product = Product.query.get_or_404(id)
    data = request.get_json()

    if 'name' in data:
        product.name = data['name']
    if 'sku' in data:
        product.sku = data['sku']
    if 'category_id' in data:
        category = Category.query.get(data['category_id'])
        if not category:
            return jsonify({'message': 'Kategori tidak ditemukan!'}), 404
        product.category_id = data['category_id']
    if 'price' in data:
        product.price = data['price']
    if 'stock' in data:
        product.stock = data['stock']

    db.session.commit()
    return jsonify({'message': 'Produk berhasil diperbarui!', 'product': product.to_dict()}), 200

# Delete Product (Butuh JWT)
@product_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required()
def delete_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({'message': 'Produk tidak ditemukan!'}), 404

    # 1. Hapus riwayat transaksi terkait produk ini secara manual
    StockTransaction.query.filter_by(product_id=id).delete()

    # 2. Hapus produknya
    db.session.delete(product)
    db.session.commit()

    return jsonify({'message': 'Produk dan riwayat transaksinya berhasil dihapus!'}), 200