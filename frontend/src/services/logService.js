import api from './api';

export const logService = {
  listEntries: async () => {
    const response = await api.get('/logs');
    return response.data?.data ?? response.data ?? [];
  },
};
