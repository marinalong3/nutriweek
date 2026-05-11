import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Injeta token em todas as requisições
api.interceptors.request.use((config) => {
  const session = localStorage.getItem('nw_session');
  if (session) {
    const { access_token } = JSON.parse(session);
    config.headers.Authorization = `Bearer ${access_token}`;
  }
  return config;
});

// Trata 401 globalmente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nw_session');
      localStorage.removeItem('nw_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
