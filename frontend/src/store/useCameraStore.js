import { create } from 'zustand';

const INITIAL_CAMERAS = [
  { 
    id: 1, 
    nome: "Triagem A", 
    setor: "Industrial", 
    ip: "192.168.1.50", 
    // A URL que o player de vídeo (HTML5/WebRTC/HLS) realmente vai consumir
    streamUrl: "rtsp://admin:12345@192.168.1.50:554/h264", 
    status: "online", // 'online' | 'offline' | 'connecting'
    epis: [{ id: "1", nome: "capacete" }, { id: "2", nome: "oculos" }, { id: "3", nome: "colete" }, { id: "4", nome: "mascara" }, { id: "5", nome: "luvas" }] 
  },
  { 
    id: 2, 
    nome: "Almoxarifado", 
    setor: "Logística", 
    ip: "192.168.1.51", 
    streamUrl: "rtsp://admin:12345@192.168.1.51:554/h264", 
    status: "online",
    epis: [{ id: "4", nome: "mascara" }, { id: "5", nome: "luvas" }] 
  },
  { 
    id: 4, 
    nome: "Entrada Principal", 
    setor: "Portaria", 
    ip: "192.168.1.53", 
    streamUrl: "rtsp://admin:12345@192.168.1.53:554/h264", 
    status: "offline",
    epis: [{ id: "3", nome: "colete" }] 
  },
];

export const useCameraStore = create((set, get) => ({
  cameras: INITIAL_CAMERAS,
  isLoading: false,
  error: null,

  // 1. Ação para buscar câmeras (Simulando chamada de API futura)
  fetchCameras: async () => {
    set({ isLoading: true, error: null });
    try {
      // Futuro: const response = await api.get('/cameras');
      // set({ cameras: response.data, isLoading: false });
      
      // Simulação por enquanto:
      set({ isLoading: false });
    } catch (err) {
      set({ error: 'Erro ao carregar câmeras', isLoading: false });
    }
  },

  // 2. Ação para Adicionar Câmera
  addCamera: async (newCameraData) => {
    set({ isLoading: true });

    // Monta o objeto padronizado
    const cameraFormatted = {
      id: Date.now(), // No futuro, o ID virá do banco
      status: 'connecting', // Nasce testando/conectando
      streamUrl: `rtsp://${newCameraData.ip}:554/stream`, // URL construída a partir do IP/porta
      ...newCameraData
    };

    try {
      // Futuro: const res = await api.post('/cameras', cameraFormatted);
      // const savedCam = res.data;

      // Atualização otimista no estado do Frontend
      set((state) => ({
        cameras: [...state.cameras, cameraFormatted],
        isLoading: false
      }));

      // Retorna a nova câmera para que o componente saiba o ID/Índice se quiser selecioná-la
      return cameraFormatted;

    } catch (err) {
      set({ error: 'Erro ao salvar câmera no banco', isLoading: false });
      throw err;
    }
  },

  // 3. Ação para atualizar status de conexão da câmera (Offline / Online)
  updateCameraStatus: (cameraId, status) => {
    set((state) => ({
      cameras: state.cameras.map((cam) =>
        cam.id === cameraId ? { ...cam, status } : cam
      )
    }));
  }
}));