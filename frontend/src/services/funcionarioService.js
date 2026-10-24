//src/services/funcionarioService.js  //Service responsável por fazer as requisições HTTP para o backend relacionadas ao cadastro facial
import api from './api';

const funcionarioService = {
  // Lista todos os funcionários cadastrados
  getFuncionarios: async () => {
    const response = await api.get('/funcionarios');
    return response.data?.data ?? response.data ?? [];
  },

  // Cria um novo funcionário (com foto em base64, se enviada)
  addFuncionario: async (funcionarioData) => {
    const response = await api.post('/funcionarios', funcionarioData);
    return response.data?.data ?? response.data;
  },

  // Atualiza um funcionário por ID
  updateFuncionario: async (id, funcionarioData) => {
    const response = await api.put(`/funcionarios/${id}`, funcionarioData);
    return response.data?.data ?? response.data;
  },

  // Deleta um funcionário por ID
  deleteFuncionario: async (id) => {
    const response = await api.delete(`/funcionarios/${id}`);
    return response.data;
  },
};

export default funcionarioService;
