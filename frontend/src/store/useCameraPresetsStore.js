// src/store/useCameraPresetsStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCameraPresetsStore = create(
  persist(
    (set, get) => ({
      // Estrutura do presets:
      // {
      //   [cameraId]: {
      //     selectedEpis: ['Capacete', 'Óculos'],
      //     riskArea: { x: 10, y: 10, width: 30, height: 40 } | null
      //   }
      // }
      presets: {},

      // --- GERENCIAMENTO DE EPIs ---
      
      // Alterna ou define a lista de EPIs para uma câmera específica
      toggleEpiForCamera: (cameraId, epiName) => set((state) => {
        if (!cameraId) return state;
        
        const currentPreset = state.presets[cameraId] || { selectedEpis: [], riskArea: null };
        const currentEpis = currentPreset.selectedEpis || [];
        
        const isAlreadySelected = currentEpis.includes(epiName);
        const updatedEpis = isAlreadySelected
          ? currentEpis.filter((name) => name !== epiName)
          : [...currentEpis, epiName];

        return {
          presets: {
            ...state.presets,
            [cameraId]: {
              ...currentPreset,
              selectedEpis: updatedEpis
            }
          }
        };
      }),

      // Define diretamente a lista inteira de EPIs para a câmera
      setSelectedEpisForCamera: (cameraId, episList) => set((state) => {
        if (!cameraId) return state;

        const currentPreset = state.presets[cameraId] || { selectedEpis: [], riskArea: null };
        
        return {
          presets: {
            ...state.presets,
            [cameraId]: {
              ...currentPreset,
              selectedEpis: Array.isArray(episList) ? episList : []
            }
          }
        };
      }),

      // --- GERENCIAMENTO DE ÁREA DE RISCO ---

      // Salva ou atualiza a Área de Risco da câmera
      setRiskAreaForCamera: (cameraId, riskArea) => set((state) => {
        if (!cameraId) return state;

        const currentPreset = state.presets[cameraId] || { selectedEpis: [], riskArea: null };

        return {
          presets: {
            ...state.presets,
            [cameraId]: {
              ...currentPreset,
              riskArea
            }
          }
        };
      }),

      // Limpa apenas a área de risco da câmera
      clearRiskAreaForCamera: (cameraId) => set((state) => {
        if (!cameraId) return state;

        const currentPreset = state.presets[cameraId];
        if (!currentPreset) return state;

        return {
          presets: {
            ...state.presets,
            [cameraId]: {
              ...currentPreset,
              riskArea: null
            }
          }
        };
      }),

      // --- REMOÇÃO E CONSULTAS ---

      // Remove todo o preset quando a câmera é deletada
      removePresetForCamera: (cameraId) => set((state) => {
        const newPresets = { ...state.presets };
        delete newPresets[cameraId];
        return { presets: newPresets };
      }),

      // Retorna os EPIs da câmera (com retrocompatibilidade para o formato antigo de Array)
      getEpiForCamera: (cameraId) => {
        if (!cameraId) return [];
        const data = get().presets[cameraId];
        if (Array.isArray(data)) return data; // Suporte caso exista dados no formato antigo
        return data?.selectedEpis || [];
      },

      // Retorna a Área de Risco da câmera
      getRiskAreaForCamera: (cameraId) => {
        if (!cameraId) return null;
        const data = get().presets[cameraId];
        if (Array.isArray(data)) return null; // Compatibilidade com chave antiga
        return data?.riskArea || null;
      },

      // Retorna o objeto completo do preset da câmera
      getPresetForCamera: (cameraId) => {
        if (!cameraId) return { selectedEpis: [], riskArea: null };
        const data = get().presets[cameraId];
        if (Array.isArray(data)) {
          return { selectedEpis: data, riskArea: null };
        }
        return {
          selectedEpis: data?.selectedEpis || [],
          riskArea: data?.riskArea || null
        };
      },

      clearAllPresets: () => set({ presets: {} })
    }),
    {
      name: 'spi-camera-presets', // Chave gravada no localStorage
    }
  )
);