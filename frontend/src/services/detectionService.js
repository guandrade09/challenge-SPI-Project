import api from './api';

const detectionService = {
  // Retorna o payload bruto do endpoint /detections
  list: async () => {
    const res = await api.get('/detections');
    return res.data; // { count, data }
  },
};

export default detectionService;
