import api from './api';
import { formatTs, formatIncidentLabel, capitalizeWords } from '../utils/formatLabel';
import { streamService } from './streamService';
import { analyzeEventLog, parseEventDate, parseDetectionDetails } from '../utils/eventDetails';
import { getValidationUrgency, normalizeConfidence, requiresEventValidation } from '../utils/eventValidation';
import { getIncidentImageSource, normalizeIncidentDetails } from '../features/incidentesPage/utils/frameOverlayData';

export const eventService = {
  listEvents: async () => {
    const [logsRes, detectionsRes, camerasRes] = await Promise.allSettled([
      api.get('/logs'),
      api.get('/detections'),
      api.get('/cameras')
    ]);

    const camerasPayload = camerasRes.status === 'fulfilled' ? camerasRes.value.data : null;
    const cameras = Array.isArray(camerasPayload) ? camerasPayload : camerasPayload?.data || [];
    const camerasById = new Map(cameras.map((camera) => [String(camera.id), camera]));

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

      const rawDate = parseEventDate(entry.rawTimestamp || entry.timestamp);
      const camera = camerasById.get(String(entry.camera_id ?? entry.camera));
      const logAnalysis = analyzeEventLog(message);
      const rawTipo = entry.tipo || entry.event_type || logAnalysis.tipo;
      
      // Mapeamento apontando diretamente para img_path do backend
      const rawImg = entry.img_path || entry.img_path_lateral || entry.imagem || entry.snapshot_url || entry.image_path || entry.frame_path || entry.frame || entry.image_url || null;

      return {
        id: entry.id ?? `LOG-${index + 1001}`,
        deleteId: entry.id ?? null,
        origem: 'Log',
        rawDate,
        timestamp: rawDate ? formatTs(rawDate) : '—',
        tipo: capitalizeWords(rawTipo),
        gravidade: entry.gravidade || (isAlta ? 'alta' : isMedia ? 'media' : 'baixa'),
        setor: capitalizeWords(entry.setor || entry.sector || 'Sistema Central'),
        camera: entry.camera || entry.camera_id || 'N/A',
        nome: camera?.nome || entry.camera_nome || entry.camera_name || entry.nome || null,
        status: entry.status || (isAlta ? 'Pendente' : 'Validado'),
        imagem: rawImg ? streamService.imagePathToUrl(rawImg) : null,
        detalhes: message,
        analise: logAnalysis.analise
      };
    });

    // 2. Tratamento das DETECÇÕES
    const normalizedDetections = rawDetections.map((entry, index) => {
      const rawLabel = entry.label ?? entry.class_name ?? entry.type ?? 'Objeto Detectado';
      const formattedLabel = formatIncidentLabel(rawLabel);
      
      const parsedDetails = parseDetectionDetails(entry.details || entry.detalhes);
      const imagemSource = getIncidentImageSource(parsedDetails, !entry.img_path && entry.img_path_lateral ? 'lateral' : 'frontal');
      const detectionDetails = normalizeIncidentDetails(parsedDetails, { cameraId: entry.camera_id,
        primarySource: imagemSource, hasLateralFrame: !!entry.img_path && !!entry.img_path_lateral });
      const validationData = { origem: 'Detecção', label: rawLabel, confidence: normalizeConfidence(entry.confidence), detectionDetails };
      const urgency = getValidationUrgency(validationData);

      const rawDate = parseEventDate(entry.timestamp);
      const camera = camerasById.get(String(entry.camera_id ?? entry.camera));
      
      // Aponta para o campo exato img_path retornado do SQLite/API
      const rawImg = entry.img_path || entry.img_path_lateral || entry.imagem || entry.snapshot_url || entry.image_url || entry.image_path || entry.frame_path || entry.frame || null;

      return {
        id: entry.id ?? `DET-${index + 1001}`,
        deleteId: Number.isSafeInteger(entry.id) && entry.id > 0 ? entry.id : null,
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
        setor: capitalizeWords(entry.setor || entry.sector || camera?.setor || 'Área Monitorada'),
        camera: entry.camera || entry.camera_id || 'CAM-IA',
        nome: camera?.nome || entry.camera_nome || entry.camera_name || entry.nome || null,
        status: entry.status || (requiresEventValidation(validationData) ? 'Pendente' : 'Validado'),
        imagem: rawImg ? streamService.imagePathToUrl(rawImg) : null,
        imagemLateral: entry.img_path_lateral ? streamService.imagePathToUrl(entry.img_path_lateral) : null,
        imagemSource,
        imagemLateralSource: getIncidentImageSource(parsedDetails, 'lateral'),
        detectionDetails,
        detalhes: entry.detalhes || entry.details || `Detecção registrada: ${formattedLabel}`
      };
    });

    const allEvents = [...normalizedLogs, ...normalizedDetections];
    return allEvents.sort((a, b) => b.rawDate - a.rawDate);
  },
  remove: async (event) => {
    if (event.deleteId == null || !['Log', 'Detecção'].includes(event.origem)) {
      throw new Error('Não foi possível identificar esta ocorrência para exclusão.');
    }
    const resource = event.origem === 'Log' ? 'logs' : 'detections';
    const response = await api.delete(`/${resource}/${encodeURIComponent(event.deleteId)}`);
    return response.data;
  },
};
