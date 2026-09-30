import { create } from 'zustand';
import { CAMERA_STATUS } from '../enums/enums';

const CONFIG_URL = 'http://127.0.0.1:5050/config/analise';
const EPIS_URL   = 'http://127.0.0.1:5050/config/epis';

// Fallback (mesmas 6 chaves de EPI_KEY_TO_PREFIX no orquestrador) usado enquanto a lista
// oficial não chega — ou se o orquestrador estiver fora do ar.
export const DEFAULT_EPI_OPTIONS = [
  { id: 'colete',    label: 'Colete'    },
  { id: 'oculos',    label: 'Óculos'    },
  { id: 'capacete',  label: 'Capacete'  },
  { id: 'mascara',   label: 'Máscara'   },
  { id: 'auricular', label: 'Auricular' },
  { id: 'botas',     label: 'Botas'     },
];

function syncOrquestrador(detections, setor = '') {
  const epis = useMonitoramentoStore.getState().epiOptions
    .map((o) => o.id)
    .filter((k) => detections[k]);
  fetch(CONFIG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ epis, ergonomia: detections.ergonomia, setor }),
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
  epiOptions:     DEFAULT_EPI_OPTIONS,   // labels de EPI exibidas nos toggles ({ id, label })
  alertas:        [],
  alertaAtivo:    null,
  liveDetections: [],
  livePose:       [],   // pessoas detectadas no frame atual com dados REBA
  verdict:        null,
  metrics:        null,
  lastFrame:      null,
  zonaConfig:     (() => { try { const s = localStorage.getItem('zonaConfig'); return s ? JSON.parse(s) : null; } catch { return null; } })(),

  setStatus: (newStatus) => set({ status: newStatus }),

  toggleDetection: (key, setor = '') => {
    const next = { ...get().detections, [key]: !get().detections[key] };
    set({ detections: next });
    syncOrquestrador(next, setor);
  },

  // Busca no orquestrador a lista de labels configuradas; em falha mantém o fallback
  loadEpiOptions: async () => {
    try {
      const res = await fetch(EPIS_URL);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const { epis } = await res.json();
      if (Array.isArray(epis) && epis.length > 0) {
        set({ epiOptions: epis.map(({ id, label }) => ({ id, label })) });
      }
    } catch (e) {
      console.warn('[SPI] lista de EPIs indisponível, usando padrão:', e.message);
    }
  },

  syncToOrquestrador: (setor = '', overrideDetections = null) =>
    syncOrquestrador(overrideDetections ?? get().detections, setor),

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