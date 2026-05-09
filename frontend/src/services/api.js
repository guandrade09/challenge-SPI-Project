import axios from 'axios';

// URL base vinda do ambiente ou fallback para localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 12000, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptador para injetar o Token do SPI-CHALLENGE
api.interceptors.request.use(
  (config) => {
    // Atualizado para refletir o nome do novo projeto
    const token = localStorage.getItem('@SPI-CHALLENGE:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptador para tratamento de erros globais
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Sessão expirada no SPI-CHALLENGE. Redirecionando...");
      // Lógica de logout aqui (ex: limpar storage e redirect)
      localStorage.removeItem('@SPI-CHALLENGE:token');
    }
    return Promise.reject(error);
  }
);

export default api;