import { create } from 'zustand';
import { CAMERA_STATUS } from '../enums/enums';

// Classes do modelo que representam ausência ou uso incorreto de EPI
// Mapeadas para a chave do toggle correspondente
const LABEL_MAP = {
  'AURICULAR - AUSENTE': 'auricular',
  'AURICULAR - ERRADO':  'auricular',
  'BOTAS - AUSENTE':     'botas',
  'CAPACETE - AUSENTE':  'capacete',
  'CAPACETE - ERRADO':   'capacete',
  'COLETE - AUSENTE':    'colete',
  'MASCARA - AUSENTE':   'mascara',
  'MASCARA - ERRADO':    'mascara',
  'OCULOS - AUSENTE':    'oculos',
  'OCULOS - ERRADO':     'oculos',
};

export const useMonitoramentoStore = create((set, get) => ({
  status: CAMERA_STATUS.IDLE,
  detections: {
    auricular: false,
    botas:     false,
    capacete:  false,
    colete:    false,
    mascara:   false,
    oculos:    false,
    ergonomia: true,
    zona:      true,
  },
  alertas:        [],
  alertaAtivo:    null,
  liveDetections: [],
  verdict:        null,
  metrics:        null,
  lastFrame:      null,
  zonaConfig:     (() => { try { const s = localStorage.getItem('zonaConfig'); return s ? JSON.parse(s) : null; } catch { return null; } })(),

  setStatus: (newStatus) => set({ status: newStatus }),

  toggleDetection: (key) => set((state) => ({
    detections: { ...state.detections, [key]: !state.detections[key] }
  })),

  setLiveDetections: (data) => set({ liveDetections: data }),
  setVerdict:        (v)    => set({ verdict: v }),
  setMetrics:        (m)    => set({ metrics: m }),
  setLastFrame:      (url)  => set({ lastFrame: url }),
  setZonaConfig: (z) => {
    if (z) localStorage.setItem('zonaConfig', JSON.stringify(z));
    else   localStorage.removeItem('zonaConfig');
    set({ zonaConfig: z });
  },

  addAlerta: (alerta) => {
    const { detections } = get();
    const epiKey = LABEL_MAP[alerta.label];
    if (!epiKey || !detections[epiKey]) return;

    const novoAlerta = {
      id:         Date.now(),
      label:      alerta.label,
      confidence: alerta.confidence,
      timestamp:  alerta.timestamp,
    };

    set((state) => ({
      alertas:     [novoAlerta, ...state.alertas].slice(0, 50),
      alertaAtivo: novoAlerta,
    }));
  },

  limparAlertaAtivo: () => set({ alertaAtivo: null }),
}));