import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AnalyticsCharts from '../components/analytics_charts';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' atau 'transactions'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Form Input Produk
  const [formData, setFormData] = useState({ name: '', sku: '', price: '', stock: '', category_id: '1' });
  const [editingId, setEditingId] = useState(null);

  // State Modal Transaksi Stok (IN/OUT)
  const [selectedProductForTrans, setSelectedProductForTrans] = useState(null);
  const [transForm, setTransForm] = useState({ type: 'IN', quantity: 1, notes: '' });

  // State Notification Banner
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Ambil data user yang tersimpan saat login
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'admin';

  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // 1. Fetch Produk
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/products/', {
        params: {
          search: searchQuery,
          category_id: selectedCategory || undefined,
        },
      });
      setProducts(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data produk.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Kategori
  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories/');
      setCategories(res.data);
    } catch (err) {
      console.warn('Gagal memuat kategori:', err);
    }
  };

  // 3. Fetch Transaksi
  const fetchTransactions = async () => {
    try {
      const res = await API.get('/transactions/');
      setTransactions(res.data);
    } catch (err) {
      console.warn('Gagal memuat riwayat transaksi:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
  }, []);

  // Handle Submit Produk (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
      category_id: Number(formData.category_id),
    };

    try {
      if (editingId) {
        await API.put(`/products/${editingId}`, payload);
        showToast('Produk berhasil diperbarui!', 'success');
      } else {
        await API.post('/products/', payload);
        showToast('Produk berhasil ditambahkan!', 'success');
      }
      setFormData({ name: '', sku: '', price: '', stock: '', category_id: categories[0]?.id || 1 });
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan produk.', 'error');
    }
  };

  // Handle Hapus Produk
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      await API.delete(`/products/${id}`);
      showToast('Produk berhasil dihapus!', 'success');
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus produk.', 'error');
    }
  };

  // Handle Submit Transaksi Stok (IN/OUT)
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductForTrans) return;

    try {
      await API.post('/transactions/', {
        product_id: selectedProductForTrans.id,
        type: transForm.type,
        quantity: Number(transForm.quantity),
        notes: transForm.notes,
      });
      showToast(`Transaksi Stock ${transForm.type} berhasil!`, 'success');
      setSelectedProductForTrans(null);
      setTransForm({ type: 'IN', quantity: 1, notes: '' });
      fetchProducts();
      fetchTransactions();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mencatat transaksi.', 'error');
    }
  };

  //Export Report
  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/transactions/export/excel', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Gagal mengunduh laporan');

      // Proses download file blob dari response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Laporan_Mutasi_Stok_SmartStock.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.message || 'Gagal export data');
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      category_id: product.category_id || 1,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // KELOLA METRIK STATISTIK ANALYTICS
  const totalItemsCount = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const totalAssetValue = products.reduce((acc, p) => acc + ((Number(p.price) || 0) * (Number(p.stock) || 0)), 0);
  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Navbar */}
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">SmartStock Dashboard</h1>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Logout
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Toast Notification Banner */}
        {notification.show && (
          <div
            className={`p-4 rounded-lg font-medium text-sm transition-all duration-300 ${
              notification.type === 'success'
                ? 'bg-green-100 border border-green-300 text-green-800'
                : 'bg-red-100 border border-red-300 text-red-800'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* ANALYTICS STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Jenis Produk</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{products.length} SKU</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Item Stok</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{totalItemsCount} Unit</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Nilai Aset</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              Rp {totalAssetValue.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Menipis (&le; 5)</p>
            <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
              {lowStockCount} Produk
            </p>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-gray-200 gap-4">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === 'products'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Master Data Produk
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === 'transactions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Riwayat Mutasi Stok (Audit Log)
          </button>
        </div>

        {/* TAB 1: MASTER DATA PRODUK */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Form Tambah/Edit Produk */}
            {isAdmin && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <input
                  type="text"
                  placeholder="Nama Produk"
                  required
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="SKU Kode"
                  required
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Harga"
                  required
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Stok Awal"
                  required
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
                <select
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  {editingId ? 'Update' : 'Simpan'}
                </button>
              </form>
            </div>)}

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
              <input
                type="text"
                placeholder="Cari berdasarkan nama / SKU..."
                className="w-full md:w-1/2 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="w-full md:w-1/4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Tabel Produk */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {loading ? (
                <p className="p-6 text-gray-500">Memuat data...</p>
              ) : error ? (
                <p className="p-6 text-red-500">{error}</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-600 text-sm">
                      <th className="p-4">SKU</th>
                      <th className="p-4">Nama Produk</th>
                      <th className="p-4">Harga</th>
                      <th className="p-4">Stok</th>
                      <th className="p-4 text-center">Aksi Transaksi</th>
                      {(isAdmin &&<th className="p-4 text-center">Kelola</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-gray-500">
                          Tidak ada produk ditemukan.
                        </td>
                      </tr>
                    ) : (
                      products.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-4 font-mono text-sm">{item.sku}</td>
                          <td className="p-4 font-medium text-gray-800">{item.name}</td>
                          <td className="p-4">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                item.stock <= 5
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {item.stock} Unit
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedProductForTrans(item)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition"
                            >
                              + / - Mutasi Stok
                            </button>
                          </td>
                          {isAdmin &&(<td className="p-4 text-center space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
                            >
                              Hapus
                            </button>
                          </td>)}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RIWAYAT MUTASI STOK */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Log Transaksi Barang Masuk & Keluar</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-600 text-sm">
                  <th className="p-4">Waktu</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Nama Produk</th>
                  <th className="p-4">Tipe</th>
                  <th className="p-4">Jumlah</th>
                  <th className="p-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      Belum ada transaksi stok recorded.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 text-sm">
                      <td className="p-4 text-gray-500">{t.created_at}</td>
                      <td className="p-4 font-mono">{t.product_sku}</td>
                      <td className="p-4 font-medium text-gray-800">{t.product_name}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            t.type === 'IN'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          STOCK {t.type}
                        </span>
                      </td>
                      <td className="p-4 font-bold">{t.quantity}</td>
                      <td className="p-4 text-gray-600">{t.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {/*UI Tombol Export */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Riwayat Mutasi Stok</h3>
                <button
                  onClick={handleExportExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2"
                >
                  📥 Export Excel (.xlsx)
                </button>
              </div>
            </table>
          </div>
        )}

        {/* MODAL POPUP MUTASI STOK */}
        {selectedProductForTrans && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg space-y-4">
              <h3 className="text-lg font-bold text-gray-800">
                Catat Transaksi: {selectedProductForTrans.name}
              </h3>
              <p className="text-xs text-gray-500">SKU: {selectedProductForTrans.sku} | Stok Saat Ini: {selectedProductForTrans.stock}</p>

              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Transaksi</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={transForm.type}
                    onChange={(e) => setTransForm({ ...transForm, type: e.target.value })}
                  >
                    <option value="IN">STOCK IN (Barang Masuk / Tambah)</option>
                    <option value="OUT">STOCK OUT (Barang Keluar / Kurangi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Unit</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={transForm.quantity}
                    onChange={(e) => setTransForm({ ...transForm, quantity: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Keterangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Restock Supplier / Penjualan Kasir"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={transForm.notes}
                    onChange={(e) => setTransForm({ ...transForm, notes: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProductForTrans(null)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    Simpan Transaksi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}