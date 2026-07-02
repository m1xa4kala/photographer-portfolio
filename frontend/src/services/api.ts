import axios, { type AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  // In development, Vite proxy handles /api, /uploads -> backend
  // In production, backend serves both frontend and API on the same port
  baseURL: import.meta.env.DEV
    ? `${import.meta.env.VITE_BACKEND_URL}/api`
    : '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;