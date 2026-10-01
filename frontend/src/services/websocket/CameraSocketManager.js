import { makeStreamKey, useCameraStreamStore } from '../../store/useCameraStreamStore.js';

const defaultWsUrl = (() => {
  if (typeof window === 'undefined') return 'ws://127.0.0.1:8765';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:8765`;
})();

const WS_URL = import.meta.env?.VITE_WS_URL || defaultWsUrl;
const RECONNECT_DELAY_MS = 5000;
const FRAME_STALE_MS = 5000;

class CameraSocketManager {
  constructor() {
    this.ws = null;
    this.subscribers = 0;
    this.frameSubscribers = 0;
    this.reconnectTimer = null;
    this.lastFrameUrls = new Map();
    this.frameExpiryTimers = new Map();
    this.pendingRequests = new Map();
    this.generation = 0;
  }

  connect() {
    if (this.subscribers === 0) return;
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return;
    this._clearReconnectTimer();
    const generation = ++this.generation;
    const ws = new WebSocket(WS_URL);
    this.ws = ws;

    ws.onopen = () => {
      if (this._isCurrent(ws, generation)) {
        useCameraStreamStore.getState().setConnected(true);
        this._syncStreamMode();
      }
    };
    ws.onmessage = (event) => {
      if (this._isCurrent(ws, generation)) this._handleMessage(event, generation);
    };
    ws.onerror = () => {
      if (this._isCurrent(ws, generation)) useCameraStreamStore.getState().setConnected(false);
    };
    ws.onclose = () => {
      if (!this._isCurrent(ws, generation)) return;
      this.ws = null;
      useCameraStreamStore.getState().setConnected(false);
      this._rejectPendingRequests('WebSocket desconectado');
      if (this.subscribers > 0) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, RECONNECT_DELAY_MS);
      }
    };
  }

  _isCurrent(ws, generation) {
    return this.ws === ws && this.generation === generation;
  }

  _clearReconnectTimer() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  async _handleMessage(event, generation = this.generation) {
    const store = useCameraStreamStore.getState();
    if (event.data instanceof Blob) {
      const parsed = await this._parseTaggedFrame(event.data);
      if (!parsed || generation !== this.generation || this.subscribers === 0) return;
      const { cameraId, setor, source, sequence, capturedAt, width, height, imageUrl } = parsed;
      const key = makeStreamKey(cameraId, setor, source);
      const previousUrl = this.lastFrameUrls.get(key);
      if (previousUrl) setTimeout(() => URL.revokeObjectURL(previousUrl), 1000);
      this.lastFrameUrls.set(key, imageUrl);
      store.setFrame(setor, source, imageUrl, { cameraId, sequence, capturedAt, width, height, receivedAt: Date.now() });
      this._scheduleFrameExpiry(key, imageUrl);
      return;
    }

    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    const setor = message.setor || '';
    switch (message.type) {
      case 'alert': store.addAlerta(setor, message); break;
      case 'detections': store.setDetections(message.camera_id, setor, message.source, message.data); break;
      case 'pose': store.setPose(setor, message.source || 'frontal', message.pessoas ?? []); break;
      case 'verdict': store.setVerdict(setor, message); break;
      case 'metrics': store.setMetrics(setor, message); break;
      case 'queda': store.addQuedaEvent(setor, message); break;
      case 'zone': store.setZone(setor, message.camera_id, message); break;
      case 'zone_updated':
        store.setZoneUpdate(message.request_id, message);
        this._settleRequest(message.request_id, true, message);
        break;
      case 'epi_config_updated':
        this._settleRequest(message.request_id, true, message);
        break;
      case 'stream_reconnect_requested':
        this._settleRequest(message.request_id, true, message);
        break;
      case 'command_error':
        store.setZoneUpdate(message.request_id, { ...message, ok: false });
        this._settleRequest(message.request_id, false, message);
        break;
      case 'stream_status': {
        store.setStreamStatus(message.camera_id, setor, message.source, message);
        if (message.status !== 'online') {
          const key = makeStreamKey(message.camera_id, setor, message.source);
          const url = this.lastFrameUrls.get(key);
          if (url) URL.revokeObjectURL(url);
          this.lastFrameUrls.delete(key);
          const timer = this.frameExpiryTimers.get(key);
          if (timer) clearTimeout(timer);
          this.frameExpiryTimers.delete(key);
          store.clearFrame(key);
        }
        break;
      }
      default: break;
    }
  }

  _scheduleFrameExpiry(key, url) {
    const oldTimer = this.frameExpiryTimers.get(key);
    if (oldTimer) clearTimeout(oldTimer);
    const timer = setTimeout(() => {
      if (this.lastFrameUrls.get(key) !== url) return;
      this.lastFrameUrls.delete(key);
      this.frameExpiryTimers.delete(key);
      URL.revokeObjectURL(url);
      useCameraStreamStore.getState().clearFrame(key);
    }, FRAME_STALE_MS);
    this.frameExpiryTimers.set(key, timer);
  }

  async _parseTaggedFrame(blob) {
    try {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const separatorIndex = bytes.indexOf(10);
      if (separatorIndex === -1) return null;
      const headerText = new TextDecoder().decode(bytes.subarray(0, separatorIndex));
      let header;
      try {
        header = JSON.parse(headerText);
        if (header.type !== 'frame') return null;
      } catch {
        const [setor = '', source = 'frontal'] = headerText.split('|');
        header = { setor, source };
      }
      const imageBytes = bytes.subarray(separatorIndex + 1);
      if (imageBytes.length === 0) return null;
      return {
        cameraId: header.camera_id ?? header.cameraId ?? null,
        setor: header.setor ?? '', source: header.source || 'frontal',
        sequence: header.sequence ?? null, capturedAt: header.captured_at ?? null,
        width: header.width ?? null, height: header.height ?? null,
        imageUrl: URL.createObjectURL(new Blob([imageBytes], { type: 'image/jpeg' })),
      };
    } catch { return null; }
  }

  send(payload) {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(payload));
    return true;
  }

  _syncStreamMode() {
    this.send({ type: 'set_stream_mode', frames: this.frameSubscribers > 0 });
  }

  sendRequest(payload, timeoutMs = 5000) {
    const requestId = payload.requestId || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Tempo esgotado aguardando confirmação'));
      }, timeoutMs);
      this.pendingRequests.set(requestId, { resolve, reject, timer });
      if (!this.send({ ...payload, requestId })) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(new Error('WebSocket desconectado'));
      }
    });
  }

  reconnectStream({ cameraId, setor = '', source = 'frontal' }) {
    return this.sendRequest({ type: 'reconnect_stream', cameraId, setor, source }, 12000);
  }

  _settleRequest(requestId, success, message) {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pendingRequests.delete(requestId);
    if (success) pending.resolve(message);
    else pending.reject(new Error(message.error || 'Comando rejeitado'));
  }

  _rejectPendingRequests(reason) {
    this.pendingRequests.forEach(({ reject, timer }) => {
      clearTimeout(timer);
      reject(new Error(reason));
    });
    this.pendingRequests.clear();
  }

  subscribe({ frames = true } = {}) {
    this.subscribers += 1;
    if (frames) this.frameSubscribers += 1;
    this.connect();
    this._syncStreamMode();
  }

  unsubscribe({ frames = true } = {}) {
    this.subscribers = Math.max(0, this.subscribers - 1);
    if (frames) {
      this.frameSubscribers = Math.max(0, this.frameSubscribers - 1);
      if (this.frameSubscribers === 0) this._clearFrameResources();
      this._syncStreamMode();
    }
    if (this.subscribers !== 0) return;
    this._clearReconnectTimer();
    this.generation += 1;
    const socket = this.ws;
    this.ws = null;
    if (socket) socket.close();
    useCameraStreamStore.getState().setConnected(false);
    this._clearFrameResources();
    this._rejectPendingRequests('WebSocket encerrado');
    useCameraStreamStore.getState().clearFrames();
  }

  _clearFrameResources() {
    this.frameExpiryTimers.forEach((timer) => clearTimeout(timer));
    this.frameExpiryTimers.clear();
    this.lastFrameUrls.forEach((url) => URL.revokeObjectURL(url));
    this.lastFrameUrls.clear();
    useCameraStreamStore.getState().clearFrames();
  }
}

export { CameraSocketManager, FRAME_STALE_MS, WS_URL };
export const cameraSocketManager = new CameraSocketManager();
