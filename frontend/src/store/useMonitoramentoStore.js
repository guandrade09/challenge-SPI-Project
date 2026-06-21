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
    colete:    false,
    oculos:    false,
    capacete:  false,
    mascara:   false,
    ergonomia: true,
    zona:      true,
  },
  alertas:        [],
  alertaAtivo:    null,
  liveDetections: [],
  verdict:        null,   // { status, reasons, sources, confidence, timestamp }
  metrics:        null,   // { latencia_total_ms, latencia_epi_ms, latencia_pose_ms, pck_pose, conf_media_epi }
  lastFrame:      null,   // data URL do último frame recebido (para preview no modal de zona)
  zonaConfig:     null,   // { camera_id, nome, pontos } zona ativa

  setStatus: (newStatus) => set({ status: newStatus }),

  toggleDetection: (key) => set((state) => ({
    detections: { ...state.detections, [key]: !state.detections[key] }
  })),

  setLiveDetections: (data) => set({ liveDetections: data }),

  setVerdict: (v) => set({ verdict: v }),

  setMetrics: (m) => set({ metrics: m }),

  setLastFrame: (url) => set({ lastFrame: url }),

  setZonaConfig: (z) => set({ zonaConfig: z }),

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