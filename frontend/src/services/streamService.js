// src/services/streamService.js
import api from './api';
import imgNotFound from '../assets/Codexis/img-not-found.jpg';

export const streamService = {
  imagePathToUrl: (imgPath) => {
    if (!imgPath || typeof imgPath !== 'string') return imgNotFound;

    // 1. Se já for uma URL absoluta (http/https/data:image), retorna direto
    if (/^(http|https|data:image):/i.test(imgPath)) {
      return imgPath;
    }

    // 2. Normaliza barras de inversão do Windows (\) para (/)
    const normalized = imgPath.replace(/\\/g, '/');

    // 3. Obtém a origem base do backend retirando '/api' e barras finais
    const rawBase = api?.defaults?.baseURL || 'http://localhost:3000';
    const origin = rawBase.replace(/\/api\/?$/i, '').replace(/\/+$/, '');

    // 4. Se contiver '/uploads/', extrai a partir do caminho do upload
    const matchUploads = normalized.match(/\/uploads\//i);
    if (matchUploads) {
      const relativePath = normalized.slice(matchUploads.index);
      return `${origin}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
    }

    // 5. Fallback para qualquer outro caminho relativo do servidor (ex: "frames/1.jpg" ou "/static/1.png")
    const cleanRelativePath = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `${origin}${cleanRelativePath}`;
  }
};