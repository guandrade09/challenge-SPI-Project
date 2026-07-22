import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

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
          const tokenFinal = data.token?.token ?? data.token;
          set({
            user: { email },
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

// Interceptador de resposta: limpa token e faz logout ao receber 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);