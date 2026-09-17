export default class Zona {
  constructor({ camera_id, nome, pontos }) {
    this.camera_id = camera_id;
    this.nome = nome;
    this.pontos = typeof pontos === 'string' ? pontos : JSON.stringify(pontos);
  }
}
