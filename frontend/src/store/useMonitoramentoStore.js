import { create } from 'zustand';
import { CAMERA_STATUS } from '../enums/enums';

const LABEL_MAP = {
  'NO-Hardhat':     'capacete',
  'NO-Safety Vest': 'colete',
  'NO-Goggles':     'oculos',
  'NO-Mask':        'mascara',
  'NO-Gloves':      'luvas',
};

export const useMonitoramentoStore = create((set, get) => ({
  status: CAMERA_STATUS.IDLE,
  detections: {
    colete:   false,
    oculos:   false,
    capacete: false,
    mascara:  false,
  },
  alertas: [],
  alertaAtivo: null,
  liveDetections: [], // ← detecções ao vivo do modelo

  setStatus: (newStatus) => set({ status: newStatus }),

  toggleDetection: (key) => set((state) => ({
    detections: { ...state.detections, [key]: !state.detections[key] }
  })),

  setLiveDetections: (data) => set({ liveDetections: data }),

  addAlerta: (alerta) => {
    const { detections } = get();
    const epiKey = LABEL_MAP[alerta.label];
    if (!epiKey || !detections[epiKey]) return;

    const novoAlerta = {
      id: Date.now(),
      label: alerta.label,
      confidence: alerta.confidence,
      timestamp: alerta.timestamp,
    };

    set((state) => ({
      alertas: [novoAlerta, ...state.alertas].slice(0, 50),
      alertaAtivo: novoAlerta,
    }));
  },

  limparAlertaAtivo: () => set({ alertaAtivo: null }),
}));