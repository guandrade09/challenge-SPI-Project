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
  setPose: (setor, source, pessoas) => set((state) => ({ pose: { ...state.pose, [setor]: { ...(state.pose[setor] || {}), [source]: pessoas } } })),
  setVerdict: (setor, verdict) => set((state) => ({ verdict: { ...state.verdict, [setor]: verdict } })),
  setMetrics: (setor, metrics) => set((state) => ({ metrics: { ...state.metrics, [setor]: metrics } })),
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
}));
