import { WS_URL } from './websocket/CameraSocketManager';
import { normalizeEpiList } from '../utils/epiConfig';

// Servidor de configuração do orquestrador (config_server.py, porta 5050). Mesmo host do
// WebSocket, salvo override por VITE_CONFIG_URL.
const CONFIG_BASE_URL = import.meta.env?.VITE_CONFIG_URL || (() => {
  try {
    const { protocol, hostname } = new URL(WS_URL);
    return `${protocol === 'wss:' ? 'https:' : 'http:'}//${hostname}:5050`;
  } catch {
    return 'http://127.0.0.1:5050';
  }
})();

const REQUEST_TIMEOUT_MS = 4000;

const timeoutSignal = () => (
  typeof AbortSignal !== 'undefined' && AbortSignal.timeout
    ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    : undefined
);

export const epiConfigService = {
  /**
   * Lê (somente leitura) a configuração de EPIs EFETIVA que o orquestrador usa para a câmera.
   * É a fonte da verdade — nunca escreve nada. Lança erro se o orquestrador não responder,
   * para o chamador manter o estado local em vez de sobrescrevê-lo.
   */
  async getCameraEpis({ cameraId, setor = '' }) {
    const params = new URLSearchParams({ setor: setor || '', camera_id: String(cameraId) });
    const response = await fetch(`${CONFIG_BASE_URL}/config/analise?${params}`, { signal: timeoutSignal() });
    if (!response.ok) throw new Error(`Orquestrador respondeu ${response.status}`);
    const config = await response.json();
    return normalizeEpiList(config?.epis);
  },

  /**
   * Lê (somente leitura) a rotação configurada para a câmera (0/90/180/270). Mesma fonte
   * de verdade de getCameraEpis (GET /config/analise) — só extrai outro campo.
   */
  async getCameraRotation({ cameraId, setor = '' }) {
    const params = new URLSearchParams({ setor: setor || '', camera_id: String(cameraId) });
    const response = await fetch(`${CONFIG_BASE_URL}/config/analise?${params}`, { signal: timeoutSignal() });
    if (!response.ok) throw new Error(`Orquestrador respondeu ${response.status}`);
    const config = await response.json();
    const rotation = Number(config?.rotation);
    return [0, 90, 180, 270].includes(rotation) ? rotation : 0;
  },

  /**
   * Lê (somente leitura) as labels de EPI configuradas no orquestrador (GET /config/epis) —
   * a fonte única dos toggles, para que TODAS apareçam (não uma lista fixa). Lança erro se o
   * orquestrador não responder ou devolver lista vazia: o chamador usa o fallback local.
   */
  async getEpiOptions() {
    const response = await fetch(`${CONFIG_BASE_URL}/config/epis`, { signal: timeoutSignal() });
    if (!response.ok) throw new Error(`Orquestrador respondeu ${response.status}`);
    const { epis } = await response.json();
    const options = Array.isArray(epis)
      ? epis.filter((epi) => epi?.id).map(({ id, label }) => ({ id, label: label || id }))
      : [];
    if (options.length === 0) throw new Error('Lista de EPIs vazia');
    return options;
  },
};

export default epiConfigService;
