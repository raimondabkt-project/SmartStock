
# SmartStock - Inventory & Stock Management System

SmartStock adalah aplikasi manajemen inventaris dan gudang berbasis web yang dirancang untuk mengelola stok produk, mutasi barang masuk/keluar, serta laporan inventaris secara efisien. Dilengkapi dengan Role-Based Access Control (RBAC)untuk membedakan hak akses pengguna secara aman.




## Tech Stack

**Frontend:** React.js (Vite), Tailwind CSS, React Router, Axios

**Backend:** Python, Flask, Flask-SQLAlchemy, Flask-JWT-Extended

**Database:** MySQL/SQlite

**Utilities:** Pandas & OpenPyXL (Excel Report Export)


## Run Locally

Clone the project

```bash
  git clone https://github.com/raimondabkt-project/SmartStock.git
```

Setup Backend Flask

```bash
  cd backend
  python -m venv venv
  venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  flask run
```

Setup Frontend(React)

```bash
  cd frontend
  npm install
  npm run dev
```


## Demo

Link : http://localhost:5173/login

