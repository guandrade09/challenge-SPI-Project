import { create } from 'zustand';
import cameraService from '../services/cameraService'; // Ajuste o caminho conforme sua estrutura

export const useCameraStore = create((set, get) => ({
  cameras: [],
  isLoading: true,
  error: null,

  // 1. Busca câmeras reais no banco SQLite
  fetchCameras: async () => {
    set({ isLoading: true, error: null });

    await new Promise((resolve) => setTimeout(resolve, 500)); // Simula atraso de 0.5s
    try {
      const data = await cameraService.getCameras();
      set({ cameras: data, isLoading: false });
    } catch (err) {
      console.error('Erro ao buscar câmeras:', err);
      set({ 
        error: err.response?.data?.message || 'Erro ao carregar câmeras', 
        isLoading: false 
      });
    }
  },

  // 2. Adiciona câmera enviando para o Backend
  addCamera: async (newCameraData) => {
    set({ isLoading: true, error: null });

    try {
      // Formatação básica antes de enviar para a API (se necessário)
      const payload = {
        status: 'connecting',
        streamUrl: newCameraData.streamUrl || `rtsp://${newCameraData.ip}:554/stream`,
        ...newCameraData
      };

      // Dispara o POST no backend
      const savedCamera = await cameraService.addCamera(payload);

      // Atualiza o estado da store com o registro real retornado pelo SQLite
      set((state) => ({
        cameras: [...state.cameras, savedCamera],
        isLoading: false
      }));

      return savedCamera;
    } catch (err) {
      console.error('Erro ao salvar câmera:', err);
      set({ 
        error: err.response?.data?.message || 'Erro ao salvar câmera no banco', 
        isLoading: false 
      });
      throw err;
    }
  },

  // 3. Atualiza o status localmente e/ou no servidor
  updateCameraStatus: async (cameraId, newStatus) => {
    // Atualização otimista no Zustand para UI responder rápido
    const previousCameras = get().cameras;
    set((state) => ({
      cameras: state.cameras.map((cam) =>
        cam.id === cameraId ? { ...cam, status: newStatus } : cam
      )
    }));

    try {
      const currentCamera = previousCameras.find(c => c.id === cameraId);
      if (currentCamera) {
        await cameraService.updateCamera(cameraId, {
          ...currentCamera,
          status: newStatus
        });
      }
    } catch (err) {
      console.error('Erro ao persisitir status no banco:', err);
      // Reverte o estado caso falhe no servidor
      set({ cameras: previousCameras });
    }
  },

  // 4. Atualiza os dados completos da câmera (nome, setor, ip, streamUrl, papel...)
  updateCamera: async (cameraId, updatedFields) => {
    const previousCameras = get().cameras;

    try {
      const savedCamera = await cameraService.updateCamera(cameraId, updatedFields);
      set((state) => ({
        cameras: state.cameras.map((cam) => (cam.id === cameraId ? savedCamera : cam))
      }));
      return savedCamera;
    } catch (err) {
      console.error('Erro ao atualizar câmera:', err);
      set({
        error: err.response?.data?.message || 'Erro ao atualizar câmera',
        cameras: previousCameras
      });
      throw err;
    }
  },

  // 5. Deletar Câmera
  deleteCamera: async (cameraId) => {
    set({ isLoading: true, error: null });
    try {
      await cameraService.deleteCamera(cameraId);
      set((state) => ({
        cameras: state.cameras.filter((cam) => cam.id !== cameraId),
        isLoading: false
      }));
    } catch (err) {
      console.error('Erro ao deletar câmera:', err);
      set({ 
        error: err.response?.data?.message || 'Erro ao excluir câmera', 
        isLoading: false 
      });
      throw err;
    }
  }
}));