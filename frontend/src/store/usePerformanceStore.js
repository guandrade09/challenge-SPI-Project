// src/store/usePerformanceStore.js
import { create } from 'zustand';
// 🚀 CORREÇÃO: Apontando para o arquivo de serviço correto (reportPerformance)
import { reportPerformanceService } from '../services/reportPerfomance'; 

export const usePerformanceStore = create((set, get) => ({
  totalPagesLoaded: 0,
  isSyncing: false,

  incrementPagesLoaded: () => set((state) => ({ 
    totalPagesLoaded: state.totalPagesLoaded + 1 
  })),

  syncPerformanceData: async () => {
    const { totalPagesLoaded, isSyncing } = get();

    if (totalPagesLoaded === 0 || isSyncing) return;

    set({ isSyncing: true });

    let floatMetric = 0.0;
    if (performance && performance.memory) {
      const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
      floatMetric = parseFloat(((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(4));
    }

    try {
      const payload = {
        totalPagesLoaded,
        thread_name: `renderFrontend_pages_${totalPagesLoaded}`, 
        quantity_of_cpu_ind_percentage: floatMetric 
      };

      console.log("Enviando telemetria de 5 minutos via Serviço:", payload);

      await reportPerformanceService.register(payload);

      set({ totalPagesLoaded: 0, isSyncing: false });
    } catch (err) {
      console.error('Erro ao sincronizar telemetria no Store:', err);
      set({ isSyncing: false });
    }
  }
}));