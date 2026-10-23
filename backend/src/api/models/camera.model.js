export default class Camera {
    constructor({ id, nome, setor, ip, streamUrl, status, epis, createdAt, updatedAt }) {
        this.id = id;
        this.nome = nome;
        this.setor = setor;
        this.ip = ip;
        this.streamUrl = streamUrl;
        this.status = status;
        this.epis = epis;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

export const CAMERA_STATUS = Object.freeze({
    INACTIVE: 'inactive',
    ACTIVE: 'active',
    REGISTERED: 'registered'
});
