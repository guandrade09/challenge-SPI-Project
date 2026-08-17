import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

// Função utilitária para extrair os dados do JWT sem bibliotecas extras
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      lastActivity: Date.now(),

      getToken: () => get().token,

      register: async (name, email, password) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/user/register', { name, email, password });
          set({ loading: false });
          return { success: true, ...data };
        } catch (err) {
          set({ loading: false });
          return { success: false, message: err.response?.data?.error || err.message };
        }
      },

      login: async (email, password) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/user/login', { email, password });
          
          // Trata se o token vem encapsulado { token: "..." } ou direto "..."
          const tokenFinal = data.token?.token ?? data.token;
          
          // Decodifica o JWT para extrair name e email inseridos pelo backend
          const decoded = parseJwt(tokenFinal);

          const userData = data.user || {
            name: decoded?.name || null,
            email: decoded?.email || email,
            id: decoded?.id || null,
          };

          set({
            user: userData,
            token: tokenFinal,
            isAuthenticated: true,
            loading: false,
            lastActivity: Date.now(),
          });
          return { success: true };
        } catch (err) {
          set({ loading: false });
          return { success: false, message: err.response?.data?.error || err.message };
        }
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false, lastActivity: 0 }),

      resetInactivityTimer: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: 'spi-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
    }
  )
);