import api from './api';

const detectionService = {
  // Retorna o payload bruto do endpoint /detections
  list: async () => {
    const res = await api.get('/detections');
    return res.data; // { count, data }
  },
  remove: async (ids) => {
    const res = await api.delete('/detections', { data: { ids } });
    return res.data;
  },
};

export default detectionService;
