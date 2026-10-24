//src/services/reconhecimentoFacialService.js  //Service responsável por consultar o log de reconhecimentos faciais reportados pelo orquestrador
import api from './api';

const reconhecimentoFacialService = {
  // Lista os reconhecimentos mais recentes (usado pelo painel "Reconhecimentos Recentes")
  getRecentes: async (limit = 20) => {
    const response = await api.get('/reconhecimentos-faciais', { params: { limit } });
    return response.data?.data ?? response.data ?? [];
  },
};

export default reconhecimentoFacialService;
