import axios from 'axios';

const apiBase = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') + '/api';
export const api = axios.create({ baseURL: apiBase });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('em_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('em_token');
      if (!location.pathname.startsWith('/login') && !location.pathname.startsWith('/public')) {
        location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);
