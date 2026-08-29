// src/services/streamService.js
import api from './api';
import imgNotFound from '../assets/Codexis/img-not-found.jpg';

export const streamService = {
  imagePathToUrl: (imgPath) => {
    if (!imgPath) return imgNotFound;

    // Se já for uma URL absoluta completa (http/https), retorna direto
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }

    // Normaliza barras do Windows (\) para URL (/)
    const normalized = imgPath.replace(/\\/g, '/');
    
    // Busca por '/uploads/' ignorando case (maiúsculas/minúsculas)
    const match = normalized.match(/\/uploads\//i);

    if (!match) return imgNotFound;

    // Obtém o índice onde começa a palavra 'uploads'
    const idx = match.index;

    // Extrai a origem da API eliminando barras ou rotas "/api" do final
    const rawBase = api?.defaults?.baseURL || 'http://localhost:3000';
    const origin = rawBase.replace(/\/api\/?$/, '').replace(/\/+$/, '');

    // Garante a barra inicial no caminho da imagem
    const relativePath = normalized.slice(idx);
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

    return `${origin}${cleanPath}`;
  }
};