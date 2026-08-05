// src/store/usePerformanceStore.js
import { create } from 'zustand';
import { reportPerformanceService } from '../services/reportPerfomance'; 

export const usePerformanceStore = create((set, get) => ({
  totalPagesLoaded: 0,
  isSyncing: false,

  incrementPagesLoaded: () => set((state) => ({ 
    totalPagesLoaded: state.totalPagesLoaded + 1 
  })),

  syncPerformanceData: async () => {
    const { totalPagesLoaded, isSyncing } = get();

    // 🚀 CORREÇÃO: Se nenhuma página foi carregada e não há interação, evita requisições vazias de 5 em 5 minutos
    if (totalPagesLoaded === 0 || isSyncing) return;

    set({ isSyncing: true });

    let calculatedMetric = 0.0;
    
    // 🚀 CORREÇÃO: Verificação segura para evitar crash no Firefox/Safari
    if (window.performance && window.performance.memory) {
      const { usedJSHeapSize, jsHeapSizeLimit } = window.performance.memory;
      calculatedMetric = parseFloat(((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(4));
    } else {
      // Fallback: Gera um peso simulado baseado nas páginas abertas caso o navegador não suporte a API de memória
      calculatedMetric = parseFloat(Math.min(5.0 + (totalPagesLoaded * 0.5), 100).toFixed(4));
    }

    try {
      const payload = {
        process_loaded: totalPagesLoaded,
        thread_name: `renderFrontend_pages`, 
        quantity_of_cpu_ind_percentage: calculatedMetric // Enviando a métrica calculada com segurança
      };

      console.log("Enviando telemetria via Serviço:", payload);

      await reportPerformanceService.register(payload);

      // Reseta o contador apenas após o sucesso do envio
      set({ totalPagesLoaded: 0, isSyncing: false });
    } catch (err) {
      console.error('Erro ao sincronizar telemetria no Store:', err);
      set({ isSyncing: false });
    }
  }
}));