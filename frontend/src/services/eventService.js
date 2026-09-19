import api from './api';
import { formatTs, formatIncidentLabel, capitalizeWords } from '../utils/formatLabel';
import { streamService } from './streamService';

export const eventService = {
  listEvents: async () => {
    const [logsRes, detectionsRes] = await Promise.allSettled([
      api.get('/logs'),
      api.get('/detections')
    ]);

    // Extração segura de Array idêntica ao IncidentesPage
    const logsPayload = logsRes.status === 'fulfilled' ? logsRes.value.data : null;
    const rawLogs = Array.isArray(logsPayload)
      ? logsPayload
      : logsPayload?.data || logsPayload?.logs || [];

    const detectionsPayload = detectionsRes.status === 'fulfilled' ? detectionsRes.value.data : null;
    const rawDetections = Array.isArray(detectionsPayload)
      ? detectionsPayload
      : detectionsPayload?.data || detectionsPayload?.incidents || [];

    // 1. Tratamento dos LOGS
    const normalizedLogs = rawLogs.map((entry, index) => {
      const message = typeof entry === 'string' ? entry : (entry.line ?? entry.message ?? entry.logs ?? '');
      const isAlta = /critico|erro|danger|sem capacete|falha/i.test(message);
      const isMedia = /alerta|warning|ausencia/i.test(message);

      const rawDate = entry.timestamp ? new Date(entry.timestamp) : new Date();
      const rawTipo = entry.tipo || entry.event_type || (message.length > 40 ? message.substring(0, 40) + '...' : message) || 'Log De Sistema';
      
      // Mapeamento apontando diretamente para img_path do backend
      const rawImg = entry.img_path || entry.img_path_lateral || entry.imagem || entry.snapshot_url || entry.image_path || entry.frame_path || entry.frame || entry.image_url || null;

      return {
        id: entry.id ?? `LOG-${index + 1001}`,
        origem: 'Log',
        rawDate,
        timestamp: formatTs(entry.timestamp),
        tipo: capitalizeWords(rawTipo),
        gravidade: entry.gravidade || (isAlta ? 'alta' : isMedia ? 'media' : 'baixa'),
        setor: capitalizeWords(entry.setor || entry.sector || 'Sistema Central'),
        camera: entry.camera || entry.camera_id || 'N/A',
        status: entry.status || (isAlta ? 'Pendente' : 'Validado'),
        imagem: streamService.imagePathToUrl(rawImg),
        detalhes: message
      };
    });

    // 2. Tratamento das DETECÇÕES
    const normalizedDetections = rawDetections.map((entry, index) => {
      const rawLabel = entry.label ?? entry.class_name ?? entry.type ?? 'Objeto Detectado';
      const formattedLabel = formatIncidentLabel(rawLabel);
      
      const isAlta = /sem capacete|ausente|critico|falha|alto/i.test(rawLabel);
      const isMedia = /alerta|warning|medio/i.test(rawLabel);

      const rawDate = entry.timestamp ? new Date(entry.timestamp) : new Date();
      
      // Aponta para o campo exato img_path retornado do SQLite/API
      const rawImg = entry.img_path || entry.img_path_lateral || entry.imagem || entry.snapshot_url || entry.image_url || entry.image_path || entry.frame_path || entry.frame || null;

      return {
        id: entry.id ?? `DET-${index + 1001}`,
        origem: 'Detecção',
        rawDate,
        timestamp: formatTs(entry.timestamp),
        tipo: entry.tipo ? capitalizeWords(entry.tipo) : formattedLabel,
        gravidade: entry.gravidade || (isAlta ? 'alta' : isMedia ? 'media' : 'baixa'),
        setor: capitalizeWords(entry.setor || entry.sector || 'Área Monitorada'),
        camera: entry.camera || entry.camera_id || 'CAM-IA',
        status: entry.status || (isAlta ? 'Pendente' : 'Validado'),
        imagem: streamService.imagePathToUrl(rawImg),
        detalhes: entry.detalhes || entry.details || `Detecção registrada: ${formattedLabel}`
      };
    });

    const allEvents = [...normalizedLogs, ...normalizedDetections];
    return allEvents.sort((a, b) => b.rawDate - a.rawDate);
  },
};