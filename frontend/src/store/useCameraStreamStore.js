import { create } from 'zustand';
import { useSystemConfigStore } from './useSystemConfigStore.js';
import { FACE_TRACK_TTL_MS, headPoint, updateFaceTracks } from '../utils/faceIdentity.js';
import { POSE_HISTORY_MS, buildEpiTracks, placeEpiTracks } from '../utils/epiAnchor.js';

const EMPTY_ARRAY = Object.freeze([]);

export const makeStreamKey = (cameraId, setor, source = 'frontal') => {
  if (cameraId !== null && cameraId !== undefined && cameraId !== '') return `camera:${cameraId}`;
  return `${setor || ''}:${source || 'frontal'}`;
};

// Nome do reconhecimento facial por pessoa da pose (ver utils/faceIdentity.js). Recalculado
// a cada pose (o nome segue a cabeça) e a cada reconhecimento (religa nomes às cabeças).
// Chave por câmera: com camera_id, pose e faces da mesma câmera caem na mesma chave.
function computeFaceIdentity(state, key, facesIsNew) {
  const pessoas = state.pose[key] || EMPTY_ARRAY;
  const facesEntry = state.faces[key];
  const prev = state.faceIdentity[key] || { tracks: [], semPose: EMPTY_ARRAY, semPoseAt: 0 };
  const now = Date.now();
  const frameWidth = state.frameMeta[key]?.width || facesEntry?.frameWidth || 640;
  const frameHeight = state.frameMeta[key]?.height || facesEntry?.frameHeight || 480;
  const scaleX = frameWidth / (facesEntry?.frameWidth || frameWidth);
  const scaleY = frameHeight / (facesEntry?.frameHeight || frameHeight);
  const faces = (facesEntry?.data || EMPTY_ARRAY).map((f) => ({
    nome: f.nome,
    reconhecido: f.reconhecido ?? (f.funcionario_id !== null && f.funcionario_id !== undefined),
    funcionario_id: f.funcionario_id,
    cx: ((f.x1 + f.x2) / 2) * scaleX,
    cy: ((f.y1 + f.y2) / 2) * scaleY,
    w: (f.x2 - f.x1) * scaleX,
  }));
  const result = updateFaceTracks(prev.tracks, {
    heads: pessoas.map((pessoa) => headPoint(pessoa.keypoints)),
    faces, facesIsNew, now,
  });
  // Rosto sem pose correspondente (muito perto da câmera, pose desligada): vai para o
  // aviso do canto enquanto o reconhecimento for recente.
  const semPoseAt = result.unmatchedFaces ? now : prev.semPoseAt;
  const semPose = result.unmatchedFaces ?? prev.semPose;
  return {
    tracks: result.tracks,
    byPose: pessoas.map((_, i) => {
      const track = result.byHead.get(i);
      return track ? { nome: track.nome, reconhecido: track.reconhecido } : null;
    }),
    semPose: now - semPoseAt <= FACE_TRACK_TTL_MS ? semPose : EMPTY_ARRAY,
    semPoseAt,
  };
}

export const useCameraStreamStore = create((set, get) => ({
  connected: false,
  frames: {},
  frameMeta: {},
  detections: {},
  faces: {},
  faceIdentity: {},
  pose: {},
  // Poses do último ~1,5s por câmera ({capturedAt, pessoas}) e caixas de EPI ancoradas
  // nelas (ver utils/epiAnchor.js).
  poseHistory: {},
  epiAnchored: {},
  verdict: {},
  metrics: {},
  alertas: {},
  quedaEvents: {},
  fallAlertQueue: [],
  riskAlertQueue: [],
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
  // `capturedAt` (s): instante do frame analisado pelo EPI. A mesma análise é reenviada a
  // cada frame pelo orquestrador; só uma análise nova recria a ancoragem na pose.
  setDetections: (cameraId, setor, source, data, capturedAt = null) => set((state) => {
    const key = makeStreamKey(cameraId, setor, source);
    const detections = { ...state.detections, [key]: data };
    const prev = state.epiAnchored[key];
    if (!capturedAt) {
      if (!prev) return { detections };
      const epiAnchored = { ...state.epiAnchored };
      delete epiAnchored[key];
      return { detections, epiAnchored };
    }
    if (prev && prev.capturedAt === capturedAt && prev.tracks.length === data.length) return { detections };
    const { tracks, boxes } = buildEpiTracks(data, capturedAt, state.poseHistory[key] || EMPTY_ARRAY);
    return { detections, epiAnchored: { ...state.epiAnchored, [key]: { capturedAt, tracks, boxes } } };
  }),
  // `meta.frameWidth`/`frameHeight` são as dimensões do frame em que as caixas foram
  // calculadas (o reconhecimento reutiliza frames da câmera numa análise separada)
  // para o overlay ajustar a escala na imagem exibida. `receivedAt` permite descartar
  // reconhecimentos antigos (o facial é o último da fila da GPU e chega com atraso).
  setFaces: (cameraId, setor, source, data, meta = {}) => set((state) => {
    const key = makeStreamKey(cameraId, setor, source);
    const faces = {
      ...state.faces,
      [key]: {
        data, frameWidth: meta.frameWidth ?? null, frameHeight: meta.frameHeight ?? null,
        receivedAt: Date.now(),
      },
    };
    const faceIdentity = { ...state.faceIdentity, [key]: computeFaceIdentity({ ...state, faces }, key, true) };
    return { faces, faceIdentity };
  }),
  setPose: (setor, source, pessoas, cameraId = null, capturedAt = null) => set((state) => {
    const key = makeStreamKey(cameraId, setor, source);
    const pose = { ...state.pose, [key]: pessoas };
    const updates = { pose };
    if (capturedAt) {
      const history = (state.poseHistory[key] || EMPTY_ARRAY).filter(
        (h) => h.capturedAt !== capturedAt && capturedAt - h.capturedAt <= POSE_HISTORY_MS / 1000
      );
      updates.poseHistory = { ...state.poseHistory, [key]: [...history, { capturedAt, pessoas }] };
    }
    const epi = state.epiAnchored[key];
    if (epi && epi.tracks.length) {
      const { tracks, boxes } = placeEpiTracks(epi.tracks, pessoas);
      updates.epiAnchored = { ...state.epiAnchored, [key]: { ...epi, tracks, boxes } };
    }
    if (state.faces[key] || state.faceIdentity[key]) {
      updates.faceIdentity = { ...state.faceIdentity, [key]: computeFaceIdentity({ ...state, pose }, key, false) };
    }
    return updates;
  }),
  setVerdict: (setor, verdict) => set((state) => ({
    verdict: { ...state.verdict, [verdict.camera_id != null || verdict.source
      ? makeStreamKey(verdict.camera_id, setor, verdict.source) : setor]: verdict },
  })),
  setMetrics: (setor, metrics) => set((state) => ({
    metrics: { ...state.metrics, [metrics.camera_id != null || metrics.source
      ? makeStreamKey(metrics.camera_id, setor, metrics.source) : setor]: metrics },
  })),
  setZone: (setor, cameraId, zone) => {
    const key = makeStreamKey(cameraId == null ? null : String(cameraId).replace(/^cam_/, ''), setor, 'frontal');
    set((state) => ({ zones: { ...state.zones, [key]: zone } }));
  },
  setZoneUpdate: (requestId, update) => set((state) => ({ zoneUpdates: { ...state.zoneUpdates, [requestId || 'latest']: update } })),
  setStreamStatus: (cameraId, setor, source, status) => {
    const key = makeStreamKey(cameraId, setor, source);
    set((state) => ({ streamStatus: { ...state.streamStatus, [key]: status } }));
  },
  addAlerta: (setor, alerta) => set((state) => {
    const eventId = alerta.event_id || `zona:${alerta.camera_id ?? 'camera'}:${alerta.area_id ?? 1}:${alerta.timestamp ?? Date.now()}`;
    const event = { ...alerta, event_id: eventId, setor: alerta.setor || setor };
    const isInvasion = alerta.label === 'Zona de Risco';
    return {
      alertas: { ...state.alertas, [setor]: [...(state.alertas[setor] || []), event].slice(-100) },
      riskAlertQueue: useSystemConfigStore.getState().invasionPopupEnabled && isInvasion && !state.riskAlertQueue.some((item) => item.event_id === eventId)
        ? [...state.riskAlertQueue, event].slice(-20) : state.riskAlertQueue,
    };
  }),
  dismissRiskAlert: (eventId) => set((state) => ({
    riskAlertQueue: state.riskAlertQueue.filter((event) => event.event_id !== eventId),
  })),
  addQuedaEvent: (setor, event) => set((state) => {
    const eventId = event.event_id || `${event.camera_id ?? 'camera'}:${event.timestamp ?? Date.now()}`;
    const normalizedEvent = { ...event, event_id: eventId, setor: event.setor || setor };
    const alreadyQueued = state.fallAlertQueue.some((item) => item.event_id === eventId);
    return {
      quedaEvents: {
        ...state.quedaEvents,
        [setor]: [...(state.quedaEvents[setor] || []), normalizedEvent].slice(-100),
      },
      fallAlertQueue: !useSystemConfigStore.getState().fallPopupEnabled || alreadyQueued
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
  // Sem um "getFacesMeta" que devolve objeto: selecione campos primitivos no componente —
  // um getter que retorna um objeto novo a cada chamada quebra a comparação por referência
  // do Zustand e re-renderiza o componente a cada mudança no store (ex.: a cada frame de
  // vídeo), travando a página.
}));

// Descartar pendências ao silenciar evita reapresentar alertas antigos ao reativar.
useSystemConfigStore.subscribe((state, previous) => {
  if (previous.fallPopupEnabled && !state.fallPopupEnabled) useCameraStreamStore.setState({ fallAlertQueue: [] });
  if (previous.invasionPopupEnabled && !state.invasionPopupEnabled) useCameraStreamStore.setState({ riskAlertQueue: [] });
});
