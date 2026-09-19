export default class Detection {
  constructor({ timestamp, label, confidence, img_Path, img_Frame, img_Frame_lateral, source, camera_id, setor, details, epi_ausente, criticidade, reba_nivel }) {
    this.timestamp = timestamp;
    this.label = label;
    this.confidence = confidence;
    this.img_Path = img_Path;
    this.img_Frame = img_Frame;
    this.img_Frame_lateral = img_Frame_lateral ?? null;
    this.source = source ?? null;
    this.camera_id = camera_id ?? null;
    this.setor = setor ?? null;
    this.details = details ?? null;
    this.epi_ausente = epi_ausente ?? null;
    this.criticidade = criticidade ?? null;
    this.reba_nivel = reba_nivel ?? null;
  }
}