import { create } from 'zustand';
import funcionarioService from '../services/funcionarioService';

export const useFuncionarioStore = create((set, get) => ({
  funcionarios: [],
  isLoading: true,
  error: null,

  fetchFuncionarios: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await funcionarioService.getFuncionarios();
      set({ funcionarios: data, isLoading: false });
    } catch (err) {
      console.error('Erro ao buscar funcionários:', err);
      set({
        error: err.response?.data?.message || 'Erro ao carregar funcionários',
        isLoading: false,
      });
    }
  },

  addFuncionario: async (newFuncionarioData) => {
    try {
      const saved = await funcionarioService.addFuncionario(newFuncionarioData);
      set((state) => ({ funcionarios: [...state.funcionarios, saved] }));
      return saved;
    } catch (err) {
      console.error('Erro ao salvar funcionário:', err);
      set({ error: err.response?.data?.message || 'Erro ao salvar funcionário no banco' });
      throw err;
    }
  },

  updateFuncionario: async (funcionarioId, updatedFields) => {
    const previousFuncionarios = get().funcionarios;
    try {
      const saved = await funcionarioService.updateFuncionario(funcionarioId, updatedFields);
      set((state) => ({
        funcionarios: state.funcionarios.map((f) => (f.id === funcionarioId ? saved : f)),
      }));
      return saved;
    } catch (err) {
      console.error('Erro ao atualizar funcionário:', err);
      set({
        error: err.response?.data?.message || 'Erro ao atualizar funcionário',
        funcionarios: previousFuncionarios,
      });
      throw err;
    }
  },

  deleteFuncionario: async (funcionarioId) => {
    set({ isLoading: true, error: null });
    try {
      await funcionarioService.deleteFuncionario(funcionarioId);
      set((state) => ({
        funcionarios: state.funcionarios.filter((f) => f.id !== funcionarioId),
        isLoading: false,
      }));
    } catch (err) {
      console.error('Erro ao deletar funcionário:', err);
      set({
        error: err.response?.data?.message || 'Erro ao excluir funcionário',
        isLoading: false,
      });
      throw err;
    }
  },
}));
