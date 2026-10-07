import { create } from 'zustand';

const EMPTY_ARRAY = Object.freeze([]);

export const makeStreamKey = (cameraId, setor, source = 'frontal') => {
  if (cameraId !== null && cameraId !== undefined && cameraId !== '') return `camera:${cameraId}`;
  return `${setor || ''}:${source || 'frontal'}`;
};

export const useCameraStreamStore = create((set, get) => ({
  connected: false,
  frames: {},
  frameMeta: {},
  detections: {},
  faces: {},
  pose: {},
  verdict: {},
  metrics: {},
  alertas: {},
  quedaEvents: {},
  fallAlertQueue: [],
  zones: {},
  zoneUpdates: {},
  streamStatus: {},

  setConnected: (value) => set({ connected: value }),
  setFrame: (setor, source, url, meta = {}) => {
    const key = makeStreamKey(meta.cameraId, setor, source);
    set((state) => ({
      frames: { ...state.frames, [key]: url },
      frameMeta: { ...state.frameMeta, [key]: {
        cameraId: meta.cameraId ?? null,
        setor: setor || '', source: source || 'frontal',
        sequence: meta.sequence ?? null, capturedAt: meta.capturedAt ?? null,
        width: meta.width ?? null, height: meta.height ?? null,
        receivedAt: meta.receivedAt ?? Date.now(),
      } },
    }));
    return key;
  },
  clearFrame: (key) => set((state) => {
    if (!state.frames[key] && !state.frameMeta[key]) return state;
    const frames = { ...state.frames }; const frameMeta = { ...state.frameMeta };
    delete frames[key]; delete frameMeta[key];
    return { frames, frameMeta };
  }),
  clearFrames: () => set({ frames: {}, frameMeta: {} }),
  setDetections: (cameraId, setor, source, data) => set((state) => ({
    detections: {
      ...state.detections,
      [makeStreamKey(cameraId, setor, source)]: data,
    },
  })),
  // `meta.frameWidth`/`frameHeight` são as dimensões do frame em que as caixas foram
  // calculadas (o reconhecimento reutiliza frames da câmera numa análise separada)
  // para o overlay ajustar a escala na imagem exibida.
  setFaces: (cameraId, setor, source, data, meta = {}) => set((state) => ({
    faces: {
      ...state.faces,
      [makeStreamKey(cameraId, setor, source)]: {
        data, frameWidth: meta.frameWidth ?? null, frameHeight: meta.frameHeight ?? null,
      },
    },
  })),
  setPose: (setor, source, pessoas, cameraId = null) => set((state) => ({
    pose: { ...state.pose, [makeStreamKey(cameraId, setor, source)]: pessoas },
  })),
  setVerdict: (setor, verdict) => set((state) => ({
    verdict: { ...state.verdict, [verdict.camera_id != null || verdict.source
      ? makeStreamKey(verdict.camera_id, setor, verdict.source) : setor]: verdict },
  })),
  setMetrics: (setor, metrics) => set((state) => ({
    metrics: { ...state.metrics, [metrics.camera_id != null || metrics.source
      ? makeStreamKey(metrics.camera_id, setor, metrics.source) : setor]: metrics },
  })),
  setZone: (setor, cameraId, zone) => {
    const key = makeStreamKey(cameraId, setor, 'frontal');
    set((state) => ({ zones: { ...state.zones, [key]: zone } }));
  },
  setZoneUpdate: (requestId, update) => set((state) => ({ zoneUpdates: { ...state.zoneUpdates, [requestId || 'latest']: update } })),
  setStreamStatus: (cameraId, setor, source, status) => {
    const key = makeStreamKey(cameraId, setor, source);
    set((state) => ({ streamStatus: { ...state.streamStatus, [key]: status } }));
  },
  addAlerta: (setor, alerta) => set((state) => ({ alertas: { ...state.alertas, [setor]: [...(state.alertas[setor] || []), alerta].slice(-100) } })),
  addQuedaEvent: (setor, event) => set((state) => {
    const eventId = event.event_id || `${event.camera_id ?? 'camera'}:${event.timestamp ?? Date.now()}`;
    const normalizedEvent = { ...event, event_id: eventId, setor: event.setor || setor };
    const alreadyQueued = state.fallAlertQueue.some((item) => item.event_id === eventId);
    return {
      quedaEvents: {
        ...state.quedaEvents,
        [setor]: [...(state.quedaEvents[setor] || []), normalizedEvent].slice(-100),
      },
      fallAlertQueue: alreadyQueued
        ? state.fallAlertQueue
        : [...state.fallAlertQueue, normalizedEvent].slice(-20),
    };
  }),
  dismissFallAlert: (eventId) => set((state) => ({
    fallAlertQueue: state.fallAlertQueue.filter((event) => event.event_id !== eventId),
  })),

  getFrame: (cameraId, setor, source = 'frontal') => {
    const state = get();
    const exactKey = makeStreamKey(cameraId, setor, source);
    const exact = state.frames[exactKey];
    const exactMeta = state.frameMeta[exactKey];
    if (exact && (!exactMeta || exactMeta.source === (source || 'frontal'))) return exact;
    // Compatibilidade com produtores sem camera_id. Nunca substitui frontal por lateral.
    if (cameraId !== null && cameraId !== undefined && cameraId !== '') {
      return state.frames[makeStreamKey(null, setor, source)] ?? null;
    }
    return null;
  },
  getFrameMeta: (cameraId, setor, source = 'frontal') => {
    const state = get();
    const exact = state.frameMeta[makeStreamKey(cameraId, setor, source)];
    if (exact?.source === (source || 'frontal')) return exact;
    return state.frameMeta[makeStreamKey(null, setor, source)] ?? null;
  },
  getDetections: (cameraId, setor, source = 'frontal') => {
    const state = get();
    const exact = state.detections[makeStreamKey(cameraId, setor, source)];
    if (Array.isArray(exact)) return exact;
    const legacy = state.detections[setor];
    if (Array.isArray(legacy)) return legacy;
    return legacy?.[source] || EMPTY_ARRAY;
  },
  getPose: (cameraId, setor, source = 'frontal') => {
    const state = get();
    const exact = state.pose[makeStreamKey(cameraId, setor, source)];
    if (Array.isArray(exact)) return exact;
    const sourcePose = state.pose[makeStreamKey(null, setor, source)];
    if (Array.isArray(sourcePose)) return sourcePose;
    const legacy = state.pose[setor];
    return (Array.isArray(legacy) ? legacy : legacy?.[source]) || EMPTY_ARRAY;
  },
  getVerdict: (cameraId, setor, source = 'frontal') => {
    const state = get();
    return state.verdict[makeStreamKey(cameraId, setor, source)]
      || state.verdict[makeStreamKey(null, setor, source)] || state.verdict[setor] || null;
  },
  getFaces: (cameraId, setor, source = 'facial') => {
    const state = get();
    return state.faces[makeStreamKey(cameraId, setor, source)]?.data || EMPTY_ARRAY;
  },
  // Sem um "getFacesMeta" que devolve objeto: monte-o a partir de dois seletores
  // primitivos (frameWidth/frameHeight) no componente, como o FaceBoxesOverlay faz — um
  // getter que retorna um objeto novo a cada chamada quebra a comparação por referência
  // do Zustand e re-renderiza o componente a cada mudança no store (ex.: a cada frame de
  // vídeo), travando a página.
}));
