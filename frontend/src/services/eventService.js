import api from './api';
import { formatTs, formatIncidentLabel, capitalizeWords } from '../utils/formatLabel';
import { streamService } from './streamService';
import { analyzeEventLog, parseEventDate, parseDetectionDetails } from '../utils/eventDetails';
import { getValidationUrgency, normalizeConfidence, requiresEventValidation } from '../utils/eventValidation';

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

      const rawDate = parseEventDate(entry.timestamp);
      const logAnalysis = analyzeEventLog(message);
      const rawTipo = entry.tipo || entry.event_type || logAnalysis.tipo;
      
      // Mapeamento apontando diretamente para img_path do backend
      const rawImg = entry.img_path || entry.img_path_lateral || entry.imagem || entry.snapshot_url || entry.image_path || entry.frame_path || entry.frame || entry.image_url || null;

      return {
        id: entry.id ?? `LOG-${index + 1001}`,
        origem: 'Log',
        rawDate,
        timestamp: rawDate ? formatTs(rawDate) : '—',
        tipo: capitalizeWords(rawTipo),
        gravidade: entry.gravidade || (isAlta ? 'alta' : isMedia ? 'media' : 'baixa'),
        setor: capitalizeWords(entry.setor || entry.sector || 'Sistema Central'),
        camera: entry.camera || entry.camera_id || 'N/A',
        status: entry.status || (isAlta ? 'Pendente' : 'Validado'),
        imagem: streamService.imagePathToUrl(rawImg),
        detalhes: message,
        analise: logAnalysis.analise
      };
    });

    // 2. Tratamento das DETECÇÕES
    const normalizedDetections = rawDetections.map((entry, index) => {
      const rawLabel = entry.label ?? entry.class_name ?? entry.type ?? 'Objeto Detectado';
      const formattedLabel = formatIncidentLabel(rawLabel);
      
      const detectionDetails = parseDetectionDetails(entry.details || entry.detalhes);
      const validationData = { origem: 'Detecção', label: rawLabel, confidence: normalizeConfidence(entry.confidence), detectionDetails };
      const urgency = getValidationUrgency(validationData);

      const rawDate = parseEventDate(entry.timestamp);
      
      // Aponta para o campo exato img_path retornado do SQLite/API
      const rawImg = entry.img_path || entry.img_path_lateral || entry.imagem || entry.snapshot_url || entry.image_url || entry.image_path || entry.frame_path || entry.frame || null;

      return {
        id: entry.id ?? `DET-${index + 1001}`,
        origem: 'Detecção',
        label: rawLabel,
        confidence: validationData.confidence,
        epi_ausente: entry.epi_ausente,
        reba_nivel: entry.reba_nivel,
        urgency,
        rawDate,
        timestamp: rawDate ? formatTs(rawDate) : '—',
        tipo: entry.tipo ? capitalizeWords(entry.tipo) : formattedLabel,
        gravidade: urgency === 'critica' ? 'alta' : urgency === 'alerta' ? 'media' : 'baixa',
        setor: capitalizeWords(entry.setor || entry.sector || 'Área Monitorada'),
        camera: entry.camera || entry.camera_id || 'CAM-IA',
        status: entry.status || (requiresEventValidation(validationData) ? 'Pendente' : 'Validado'),
        imagem: rawImg ? streamService.imagePathToUrl(rawImg) : null,
        imagemLateral: entry.img_path_lateral ? streamService.imagePathToUrl(entry.img_path_lateral) : null,
        imagemSource: !entry.img_path && entry.img_path_lateral ? 'lateral' : 'frontal',
        detectionDetails,
        detalhes: entry.detalhes || entry.details || `Detecção registrada: ${formattedLabel}`
      };
    });

    const allEvents = [...normalizedLogs, ...normalizedDetections];
    return allEvents.sort((a, b) => b.rawDate - a.rawDate);
  },
};
