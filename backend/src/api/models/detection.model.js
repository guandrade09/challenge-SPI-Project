export default class Detection {
<<<<<<< Updated upstream
  constructor({ timestamp, label, confidence, img_Frame, img_Frame_lateral, source, camera_id, setor, details }) {
=======
  constructor({ timestamp, label, confidence, img_Frame, img_Frame_lateral, source, camera_id, setor, details, epi_ausente, criticidade, reba_nivel }) {
>>>>>>> Stashed changes
    this.timestamp = timestamp;
    this.label = label;
    this.confidence = confidence;
    this.img_path = null;          // preenchido pelo service após gravar a imagem em disco
    this.img_path_lateral = null;  // idem, só quando há 2ª câmera
    this.img_Frame = img_Frame;
    this.img_Frame_lateral = img_Frame_lateral ?? null;
    this.source = source ?? null;
    this.camera_id = camera_id ?? null;
    this.setor = setor ?? null;
    this.details = details ?? null;
<<<<<<< Updated upstream
=======
    // uma linha por causa do incidente (ver createDetection): flags que só se aplicam a certos tipos
    this.epi_ausente = epi_ausente ?? null;   // EPI: true quando está faltando
    this.criticidade = criticidade ?? null;   // status do veredito (ALERTA, ALERTA_CRITICO...)
    this.reba_nivel = reba_nivel ?? null;     // ergonomia: nível REBA
>>>>>>> Stashed changes
  }
}
