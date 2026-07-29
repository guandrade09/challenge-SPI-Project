// src/store/useCameraPresetsStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCameraPresetsStore = create(
  persist(
    (set, get) => ({
      presets: {},

      toggleEpiForCamera: (cameraId, epiName) => set((state) => {
        const currentSelected = state.presets[cameraId] || [];
        const isAlreadySelected = currentSelected.includes(epiName);
        const updatedEpis = isAlreadySelected
          ? currentSelected.filter(name => name !== epiName)
          : [...currentSelected, epiName];

        return {
          presets: {
            ...state.presets,
            [cameraId]: updatedEpis
          }
        };
      }),

      // Limpa os dados persistidos da câmera deletada
      removePresetForCamera: (cameraId) => set((state) => {
        const newPresets = { ...state.presets };
        delete newPresets[cameraId];
        return { presets: newPresets };
      }),

      getEpiForCamera: (cameraId) => {
        const data = get().presets[cameraId];
        return Array.isArray(data) ? data : [];
      },

      clearAllPresets: () => set({ presets: {} })
    }),
    {
      name: 'spi-camera-presets',
    }
  )
);