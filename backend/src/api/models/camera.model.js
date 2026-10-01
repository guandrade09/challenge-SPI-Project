export default class Camera {
    constructor({ id, nome, setor, ip, streamUrl, status, epis, papel, createdAt, updatedAt }) {
        this.id = id;
        this.nome = nome;
        this.setor = setor;
        this.ip = ip;
        this.streamUrl = streamUrl;
        this.status = status;
        this.epis = epis;
        this.papel = papel ?? null;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

export const CAMERA_STATUS = Object.freeze({
    INACTIVE: 'inactive',
    ACTIVE: 'active',
    REGISTERED: 'registered'
});

export const CAMERA_PAPEL = Object.freeze({
    FRONTAL: 'frontal',
    LATERAL: 'lateral'
});
