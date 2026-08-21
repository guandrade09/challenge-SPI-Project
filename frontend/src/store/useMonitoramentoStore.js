import { create } from 'zustand';
import { CAMERA_STATUS } from '../enums/enums';

const CONFIG_URL = 'http://127.0.0.1:5050/config/analise';
const EPI_KEYS = ['auricular', 'botas', 'capacete', 'colete', 'mascara', 'oculos'];

function syncOrquestrador(detections) {
  const epis = EPI_KEYS.filter((k) => detections[k]);
  fetch(CONFIG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ epis, ergonomia: detections.ergonomia }),
  })
    .then((r) => r.json())
    .then((d) => console.log('[SPI] config analise →', d))
    .catch((e) => console.warn('[SPI] orquestrador config falhou:', e));
}

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
    auricular: true,
    botas:     true,
    capacete:  true,
    colete:    true,
    mascara:   true,
    oculos:    true,
    ergonomia: true,
    zona:      true,
  },
  alertas:        [],
  alertaAtivo:    null,
  liveDetections: [],
  livePose:       [],   // pessoas detectadas no frame atual com dados REBA
  verdict:        null,
  metrics:        null,
  lastFrame:      null,
  zonaConfig:     (() => { try { const s = localStorage.getItem('zonaConfig'); return s ? JSON.parse(s) : null; } catch { return null; } })(),

  setStatus: (newStatus) => set({ status: newStatus }),

  toggleDetection: (key) => {
    const next = { ...get().detections, [key]: !get().detections[key] };
    set({ detections: next });
    syncOrquestrador(next);
  },

  syncToOrquestrador: () => syncOrquestrador(get().detections),

  setLiveDetections: (data) => set({ liveDetections: data }),
  setLivePose: (pessoas) => set({ livePose: pessoas }),
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
      setor:      alerta.setor ?? '',
    };

    set((state) => ({
      alertas:     [novoAlerta, ...state.alertas].slice(0, 50),
      alertaAtivo: novoAlerta,
    }));
  },

  limparAlertaAtivo: () => set({ alertaAtivo: null }),

  limparAlertasDoSetor: (setor) => set((state) => ({
    alertas:     state.alertas.filter((a) => a.setor !== setor),
    alertaAtivo: state.alertaAtivo?.setor === setor ? null : state.alertaAtivo,
  })),
}));