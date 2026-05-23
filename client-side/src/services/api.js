/**
 * API Service — Axios instance with interceptors.
 * 
 * Ready to be pointed at a real backend.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('nini-user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Response interceptor — handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.endsWith('/login')) {
      localStorage.removeItem('nini-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
