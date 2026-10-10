from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Product
from app.models.stock_transaction import StockTransaction
import pandas as pd
import io

transaction_bp = Blueprint('transaction', __name__, url_prefix='/api/transactions')

# 1. Catat Transaksi Stok (IN / OUT)
@transaction_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_transaction():
    current_user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    
    product_id = data.get('product_id')
    trans_type = data.get('type') # 'IN' atau 'OUT'
    notes = data.get('notes', '')

    # Safely parse quantity ke integer
    try:
        quantity = int(data.get('quantity', 0))
    except (ValueError, TypeError):
        return jsonify({'message': 'Jumlah barang (quantity) harus angka valid!'}), 400

    if not product_id or not trans_type or not quantity:
        return jsonify({'message': 'Data transaksi tidak lengkap!'}), 400

    if trans_type not in ['IN', 'OUT']:
        return jsonify({'message': 'Tipe transaksi harus IN atau OUT!'}), 400

    if quantity <= 0:
        return jsonify({'message': 'Jumlah barang harus lebih dari 0!'}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Produk tidak ditemukan!'}), 404

    # Validasi jika stok keluar melebihi stok yang ada
    if trans_type == 'OUT' and product.stock < quantity:
        return jsonify({'message': f'Stok tidak cukup! Stok saat ini: {product.stock}'}), 400

    # Update jumlah stok di tabel Product
    if trans_type == 'IN':
        product.stock += quantity
    elif trans_type == 'OUT':
        product.stock -= quantity

    # Simpan riwayat transaksi
    new_transaction = StockTransaction(
        product_id=product_id,
        type=trans_type,
        quantity=quantity,
        notes=notes
    )

    db.session.add(new_transaction)
    db.session.commit()

    return jsonify({
        'message': f'Berhasil melakukan Stock {trans_type}!',
        'product': product.to_dict(),
        'transaction': new_transaction.to_dict()
    }), 201


# 2. Get All Riwayat Transaksi (Log Mutasi Stok)
@transaction_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_transactions():
    transactions = StockTransaction.query.order_by(StockTransaction.created_at.desc()).all()
    return jsonify([t.to_dict() for t in transactions]), 200


# Endpoint Export CSV / Excel
@transaction_bp.route('/export/excel', methods=['GET'], strict_slashes=False)
@jwt_required()
def export_excel():
    transactions = StockTransaction.query.all()
    
    # 1. Format data transaksi
    data = []
    for t in transactions:
        data.append({
            'ID Transaksi': t.id,
            'Tanggal': t.created_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(t, 'created_at') else '-',
            'Nama Produk': t.product.name if t.product else 'Produk Dihapus',
            'Tipe': t.type, # IN / OUT
            'Jumlah': t.quantity,
            'Catatan': t.notes or '-'
        })

    # 2. Buat DataFrame Pandas
    df = pd.DataFrame(data)

    # 3. Simpan ke buffer memory sebagai file Excel
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Riwayat Mutasi')
    
    output.seek(0)

    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='Laporan_Mutasi_Stok_SmartStock.xlsx'
    )