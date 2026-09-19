import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_PRESET = { selectedEpis: [], riskArea: null };

export const useCameraPresetsStore = create(
  persist(
    (set, get) => ({
      presets: {},
      lastCameraId: null,

      setLastCameraId: (cameraId) => set({ lastCameraId: cameraId }),
      getLastCameraId: () => get().lastCameraId,

      toggleEpiForCamera: (cameraId, epiName) => set((state) => {
        if (!cameraId) return state;
        const currentPreset = state.presets[cameraId] || DEFAULT_PRESET;
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

      setSelectedEpisForCamera: (cameraId, episList) => set((state) => {
        if (!cameraId) return state;
        const currentPreset = state.presets[cameraId] || DEFAULT_PRESET;
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

      setRiskAreaForCamera: (cameraId, riskArea) => set((state) => {
        if (!cameraId) return state;
        const currentPreset = state.presets[cameraId] || DEFAULT_PRESET;
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

      removePresetForCamera: (cameraId) => set((state) => {
        const newPresets = { ...state.presets };
        delete newPresets[cameraId];
        return { presets: newPresets };
      }),

      getEpiForCamera: (cameraId) => {
        if (!cameraId) return [];
        const data = get().presets[cameraId];
        if (Array.isArray(data)) return data;
        return data?.selectedEpis || [];
      },

      getRiskAreaForCamera: (cameraId) => {
        if (!cameraId) return null;
        const data = get().presets[cameraId];
        if (Array.isArray(data)) return null;
        return data?.riskArea || null;
      },

      getPresetForCamera: (cameraId) => {
        if (!cameraId) return DEFAULT_PRESET;
        const data = get().presets[cameraId];
        if (Array.isArray(data)) {
          return { selectedEpis: data, riskArea: null };
        }
        return {
          selectedEpis: data?.selectedEpis || [],
          riskArea: data?.riskArea || null
        };
      },

      clearAllPresets: () => set({ presets: {}, lastCameraId: null })
    }),
    {
      name: 'spi-camera-presets',
    }
  )
);