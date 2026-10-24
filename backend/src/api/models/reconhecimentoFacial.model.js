export default class ReconhecimentoFacial {
  constructor({ id, funcionario_id, nome_detectado, camera_id, setor, confidence, timestamp, img_Frame, img_path }) {
    this.id = id;
    this.funcionario_id = funcionario_id ?? null; // null = rosto detectado mas não reconhecido
    this.nome_detectado = nome_detectado ?? 'Desconhecido';
    this.camera_id = camera_id ?? null;
    this.setor = setor ?? null;
    this.confidence = confidence ?? null;
    this.timestamp = timestamp;
    this.img_path = img_path ?? null; // preenchido pelo service após gravar a imagem em disco
    this.img_Frame = img_Frame ?? null;
  }
}
