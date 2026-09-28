// src/services/reportPerformance.js
import api from './api';

export const reportPerformanceService = {
  /**
   * Envia os dados consolidados de telemetria para o servidor
   * @param {Object} payload - { thread_name, quantity_of_cpu_ind_percentage }
   */
  register: async (payload) => {
    // 🚀 Garante o match com a rota correta do backend
    const response = await api.post('/threads', payload);
    return response.data;
  },

  /**
   * Puxa o histórico de métricas salvas
   */
  listMetrics: async () => {
    const response = await api.get('/threads');
    return response.data;
  }
};