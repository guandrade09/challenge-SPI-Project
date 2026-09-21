//src/services/zonaService.js  //Service responsável por persistir a zona de risco no backend (é isso que o orquestrador Python lê de verdade — ver zone_checker.py)
import api from './api';

const zonaService = {
  // pontos: [{x, y}, ...] em pixels reais do frame (não porcentagem)
  saveZona: async ({ cameraId, nome, pontos }) => {
    const response = await api.post('/zonas', { camera_id: cameraId, nome, pontos });
    return response.data;
  },

  deleteZona: async (cameraId) => {
    const response = await api.delete(`/zonas/${cameraId}`);
    return response.data;
  },
};

export default zonaService;
