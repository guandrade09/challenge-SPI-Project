import {
  createReconhecimento,
  listReconhecimentos,
  listReconhecimentosPorFuncionario,
} from '../services/reconhecimentoFacial.service.js';

import { ErrorHandler } from '../utils/appError.js';

export async function create(req, res) {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Body não enviado' });
    }
    const reconhecimento = await createReconhecimento(req.body);
    return res.status(201).json({ message: 'Reconhecimento registrado com sucesso', data: reconhecimento });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function list(req, res) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const data = await listReconhecimentos(limit);
    return res.status(200).json({ count: data.length, data });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function listByFuncionario(req, res) {
  try {
    const { funcionarioId } = req.params;
    const data = await listReconhecimentosPorFuncionario(funcionarioId);
    return res.status(200).json({ count: data.length, data });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}
