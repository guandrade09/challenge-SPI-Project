///// src/store/useCameraPresetsStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCameraPresetsStore = create(
  persist(
    (set, get) => ({
      // Agora a estrutura será um Array de strings por câmera: { [cameraId]: ["capacete", "colete"] }
      presets: {},

      // Gerencia a inserção ou remoção de um EPI na lista daquela câmera
      toggleEpiForCamera: (cameraId, epiName) => set((state) => {
        const currentSelected = state.presets[cameraId] || [];
        
        // Verifica se o EPI já estava selecionado
        const isAlreadySelected = currentSelected.includes(epiName);
        
        const updatedEpis = isAlreadySelected
          ? currentSelected.filter(name => name !== epiName) // Se já existia, remove (toggle off)
          : [...currentSelected, epiName];                  // Se não existia, adiciona (toggle on)
        
        return {
          presets: {
            ...state.presets,
            [cameraId]: updatedEpis
          }
        };
      }),

      // Retorna a lista de EPIs ativos de uma câmera específica (garante sempre retornar um array)
      getEpiForCamera: (cameraId) => {
        const data = get().presets[cameraId];
        return Array.isArray(data) ? data : [];
      },

      clearAllPresets: () => set({ presets: {} })
    }),
    {
      name: 'spi-camera-presets', // Mantém salvo no LocalStorage
    }
  )
);

