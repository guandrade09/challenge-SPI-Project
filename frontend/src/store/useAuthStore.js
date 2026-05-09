import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

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
          });
          return { success: true };
        } catch (err) {
          set({ loading: false });
          return { success: false, message: err.response?.data?.error || err.message };
        }
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'spi-auth-storage' }
  )
);

