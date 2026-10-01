import {
  createFuncionario,
  listFuncionarios,
  getFuncionario,
  updateFuncionarioById,
  deleteFuncionarioById,
} from '../services/funcionario.service.js';

import { ErrorHandler } from '../utils/appError.js';

export async function create(req, res) {
  try {
    const funcionario = await createFuncionario(req.body ?? {});
    return res.status(201).json({ message: 'Funcionário cadastrado com sucesso', data: funcionario });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function list(req, res) {
  try {
    const data = await listFuncionarios();
    return res.status(200).json({ count: data.length, data });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const funcionario = await getFuncionario(id);
    if (!funcionario) {
      return res.status(404).json({ message: 'Funcionário não encontrado' });
    }
    return res.status(200).json({ data: funcionario });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function updateById(req, res) {
  try {
    const { id } = req.params;
    const funcionario = await updateFuncionarioById(id, req.body ?? {});
    return res.status(200).json({ message: 'Funcionário atualizado com sucesso', data: funcionario });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function deleteById(req, res) {
  try {
    const { id } = req.params;
    await deleteFuncionarioById(id);
    return res.status(200).json({ message: 'Funcionário removido com sucesso' });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}
