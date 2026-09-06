// src/store/useDataStore.js
import { create } from 'zustand';
import { reportService } from '../services/reportService'; // ajuste o caminho do seu service

export const useDataStore = create((set, get) => ({
  reportData: null,
  reportFiles: [],
  isLoading: false,
  lastUpdated: null,
  error: null,

  // Função que busca os dados do Service e atualiza o estado
  fetchReport: async () => {
    set({ isLoading: true, error: null });
    try {
      // Passando nulos ou as datas desejadas para o seu service
      const response = await reportService.getSummary();
      set({ 
        reportData: response, 
        lastUpdated: new Date(), // Guarda o momento exato da atualização
        isLoading: false 
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchReportFiles: async ({ day, month, year } = {}) => {
    set({ isLoading: true, error: null });
    try {
      const files = await reportService.listReportFiles({ day, month, year });
      // Aqui você pode escolher como armazenar os arquivos no estado, por exemplo:
      set({ reportFiles: files || [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  }


}));