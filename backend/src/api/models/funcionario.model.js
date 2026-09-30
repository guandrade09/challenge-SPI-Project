export default class Funcionario {
  constructor({ id, nome, matricula, setor, cargo, foto_path, face_encoding, status, created_at, updated_at }) {
    this.id = id;
    this.nome = nome;
    this.matricula = matricula ?? null;
    this.setor = setor ?? null;
    this.cargo = cargo ?? null;
    this.foto_path = foto_path ?? null;
    // vetor de embedding calculado pelo orquestrador (ml_facial); null até o primeiro reconhecimento
    this.face_encoding = face_encoding ?? null;
    this.status = status || FUNCIONARIO_STATUS.ATIVO;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

export const FUNCIONARIO_STATUS = Object.freeze({
  ATIVO: 'ativo',
  INATIVO: 'inativo',
});
