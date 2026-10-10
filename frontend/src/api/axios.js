import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// 1. Request Interceptor: Tempelkan Bearer Token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Response Interceptor: Tangani Error 401 (Unauthorized / Token Expired)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Hapus token lama yang tidak valid
      localStorage.removeItem('token');
      
      // Redirect ke halaman login jika tidak sedang di halaman login/register
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;