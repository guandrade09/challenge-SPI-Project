//src/services/cameraService.js  //Service responsável por fazer as requisições HTTP para o backend relacionadas às câmeras
import api from './api';

const cameraService = {
  // Lista todas as câmeras do banco
  getCameras: async () => {
    const response = await api.get('/cameras');
    // Trata o wrapper { count, data } retornado pelo controller
    return response.data?.data ?? response.data ?? [];
  },

  // Cria uma nova câmera no banco
  addCamera: async (cameraData) => {
    const response = await api.post('/cameras', cameraData);
    // Retorna o objeto da câmera recém-criada (que vem dentro de response.data.data)
    return response.data?.data ?? response.data;
  },

  // Atualiza uma câmera por ID
  updateCamera: async (id, cameraData) => {
    // 🚀 Corrigido: Removido o '=' e '?' do final da URL
    const response = await api.put(`/cameras/${id}`, cameraData);
    return response.data?.data ?? response.data;
  },

  // Deleta uma câmera por ID
  deleteCamera: async (id) => {
    const response = await api.delete(`/cameras/${id}`);
    return response.data;
  },
};

export default cameraService;