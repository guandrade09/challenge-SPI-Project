import api from './api';
import { logService } from './logService'; // Importando seu serviço nativo de logs

export const analiseService = {
  // Retorna o payload de detecções
  getDetections: async () => {
    const res = await api.get('/detections');
    return res.data; // Esperado: { count, data }
  },

  // Usa diretamente a sua implementação do logService que já trata `response.data?.data ?? response.data`
  getLogs: async () => {
    const entries = await logService.listEntries();
    return (entries || []).map((entry) => ({
      timestamp: entry.timestamp,
      message: entry.line ?? entry.message ?? entry.logs ?? '',
    }));
  },
};

export default analiseService;