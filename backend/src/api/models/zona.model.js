export default class Zona {
  constructor({ camera_id, nome, pontos, areas }) {
    this.camera_id = camera_id;
    this.nome = nome;
    this.pontos = areas ? JSON.stringify({ areas }) : (typeof pontos === 'string' ? pontos : JSON.stringify(pontos));
  }
}
