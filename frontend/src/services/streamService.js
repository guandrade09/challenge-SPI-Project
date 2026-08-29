import api from './api';

export const streamService = {

    imagePathToUrl: async (imgPath) => {
        if (!imgPath) return null;
        const normalized = imgPath.replace(/\\/g, '/');
        const idx = normalized.indexOf('/uploads/');
        if (idx === -1) return null;
        return `${api}${normalized.slice(idx)}`;
    }

}
