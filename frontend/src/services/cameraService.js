import api from './api';

const cameraService = {
  getCameras: async () => {
    const response = await api.get('/cameras');
    return response.data?.data ?? response.data ?? [];
  },
  addCamera: async (camera) => {
    const response = await api.post('/cameras', camera);
    return response.data;
  },
  updateCamera: async (id, camera) => {
    const response = await api.put(`/cameras/${id}=?`, camera);
    return response.data;
  },
  deleteCamera: async (id) => {
    const response = await api.delete(`/cameras/${id}`);
    return response.data;
  },
};

export default cameraService;