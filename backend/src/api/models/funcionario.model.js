export const MAX_FOTOS_FUNCIONARIO = 3;

export default class Funcionario {
  constructor({ id, nome, matricula, setor, cargo, fotos, face_encodings, status, created_at, updated_at }) {
    this.id = id;
    this.nome = nome;
    this.matricula = matricula ?? null;
    this.setor = setor ?? null;
    this.cargo = cargo ?? null;
    // até MAX_FOTOS_FUNCIONARIO caminhos de foto de referência (mais fotos = embeddings
    // mais robustos pro reconhecimento, ver ml_facial/face_recognizer.py)
    this.fotos = Array.isArray(fotos) ? fotos.slice(0, MAX_FOTOS_FUNCIONARIO) : [];
    // JSON (array de embeddings, um por foto) calculado pelo orquestrador; null até o
    // primeiro ciclo de sincronização
    this.face_encodings = face_encodings ?? null;
    this.status = status || FUNCIONARIO_STATUS.ATIVO;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

export const FUNCIONARIO_STATUS = Object.freeze({
  ATIVO: 'ativo',
  INATIVO: 'inativo',
});
