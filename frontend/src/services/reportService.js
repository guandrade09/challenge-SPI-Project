// src/services/reportService.js
import api from './api';

export const reportService = {
  // AINDA NÃO UTILIZADO
  getPdf: async ({ label, start, end } = {}) => {
    const response = await api.get('/report/pdf', {
      params: { label, start, end },
      responseType: 'blob',
    });
    return response.data;
  },

  getSummary: async ({ label, start, end } = {}) => {
    const response = await api.get('/report/pdf/summary', { params: { label, start, end } });
    return response.data;
  },

  downloadPdf: async ({ label, start, end } = {}) => {
    const response = await api.get('/report/pdf/download', {
      params: { label, start, end },
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'relatorio.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // AINDA NÃO UTILIZADO
  downloadExcel: async ({ label, start, end } = {}) => {
    const response = await api.get('/report/excel/download', {
      params: { label, start, end },
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'relatorio.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};