// src/store/usePerformanceStore.js
import { create } from 'zustand';
import api from '../services/api';

export const usePerformanceStore = create((set, get) => ({
  totalPagesLoaded: 0,
  isSyncing: false,

  // Incrementa sempre que o usuário carrega ou muda de página
  incrementPagesLoaded: () => set((state) => ({ 
    totalPagesLoaded: state.totalPagesLoaded + 1 
  })),

  // Prepara e envia o payload simplificado
  syncPerformanceData: async () => {
    const { totalPagesLoaded, isSyncing } = get();

    // Se nenhuma página foi carregada ainda, não faz sentido enviar dados zerados
    if (totalPagesLoaded === 0 || isSyncing) return;

    set({ isSyncing: true });

    // Cálculo da porcentagem do uso de memória em relação ao teto do navegador
    let floatMetric = 0.0;
    if (performance && performance.memory) {
      const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
      // Ex: (30MB / 4000MB) = 0.0075 -> Convertido em porcentagem: 0.75%
      floatMetric = parseFloat(((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(4));
    }

    try {
      const payload = {
        totalPagesLoaded,
        renderFrontend: "renderFrontend", // Identificador estático solicitado
        floatMetric // Porcentagem do uso de memória atual vs teto máximo
      };

      await api.post('/thread/register', payload);

      // Zera o contador de páginas acumuladas após o envio com sucesso
      set({ totalPagesLoaded: 0, isSyncing: false });
    } catch (err) {
      console.error('Erro ao sincronizar telemetria:', err);
      set({ isSyncing: false });
    }
  }
}));