import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false, // Novo: para mostrar um spinner no botão

      register: async (name, email, password) => {
        set({ loading: true });
        try {
          const response = await fetch('http://localhost:3000/api/user/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            // Pega a mensagem de erro vinda do seu AppError no backend
            throw new Error(data.error || 'Erro ao criar conta');
          }

          set({ loading: false });
          return { success: true };
        } catch (error) {
          set({ loading: false });
          return { success: false, message: error.message };
        }
      },

      login: async (email, password) => {
        set({ loading: true });
        try {
          const response = await fetch('http://localhost:3000/api/user/login', { // Ajuste a porta se necessário
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Erro ao fazer login');
          }

          // O seu backend retorna { token: { token: "..." } } por causa do service. 
          // Ajuste no backend ou desestruture aqui:
          const tokenFinal = data.token.token || data.token;

          set({ 
            user: { email }, // Você pode extrair mais dados do JWT se quiser
            token: tokenFinal, 
            isAuthenticated: true,
            loading: false 
          });

          return { success: true };
        } catch (error) {
          set({ loading: false });
          return { success: false, message: error.message };
        }
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'spi-auth-storage' }
  )
);

