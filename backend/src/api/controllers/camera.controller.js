// src/controllers/camera.controller.js
import * as cameraService from "../services/camera.service.js";

// Erros de negócio deliberados (ex.: 409 "o setor já possui uma câmera frontal", lançado pelo
// camera.service) trazem `statusCode` 4xx e uma mensagem própria para o cliente — repassados
// com o status e o texto originais. Qualquer outro erro é interno: o detalhe fica só no log do
// servidor e a resposta não expõe mensagens internas (SQL, caminhos...).
function internalError(res, error, message) {
  const status = Number(error?.statusCode);
  if (status >= 400 && status < 500) {
    return res.status(status).json({ message, error: error.message });
  }
  console.error(`[CAMERAS] ${message}:`, error);
  return res.status(500).json({ message, error: 'Erro interno do servidor' });
}

function invalidId(res) {
  return res.status(400).json({ message: 'ID de câmera inválido', error: 'ID de câmera inválido' });
}

const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

export async function createCamera(req, res) {
  try {
    const { nome, setor, ip } = req.body ?? {};
    if (!nome || !setor || !ip) {
      return res.status(400).json({
        message: 'Nome, setor e ip são obrigatórios',
        error: 'Nome, setor e ip são obrigatórios',
      });
    }

    const camera = await cameraService.createCamera(req.body);
    return res.status(201).json({ message: 'Câmera criada com sucesso', data: camera });
  } catch (error) {
    return internalError(res, error, 'Erro ao criar a câmera');
  }
}

export async function listCameras(req, res) {
  try {
    const cameras = await cameraService.listCameras();
    return res.status(200).json({ count: cameras.length, data: cameras });
  } catch (error) {
    return internalError(res, error, 'Erro ao listar as câmeras');
  }
}

export async function getCamera(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return invalidId(res);

    const camera = await cameraService.getCamera(id);
    if (!camera) {
      return res.status(404).json({ message: 'Câmera não encontrada' });
    }
    return res.status(200).json({ data: camera });
  } catch (error) {
    return internalError(res, error, 'Erro ao buscar a câmera');
  }
}

export async function updateCameraById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return invalidId(res);

    const updatedCamera = await cameraService.updateCameraById(id, req.body);
    if (!updatedCamera) {
      return res.status(404).json({ message: 'Câmera não encontrada' });
    }
    return res.status(200).json({ message: 'Câmera atualizada com sucesso', data: updatedCamera });
  } catch (error) {
    return internalError(res, error, 'Erro ao atualizar a câmera');
  }
}

export async function deleteCameraById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return invalidId(res);

    const success = await cameraService.deleteCameraById(id);
    if (!success) {
      return res.status(404).json({ message: 'Câmera não encontrada' });
    }
    return res.status(200).json({ message: 'Câmera excluída com sucesso' });
  } catch (error) {
    return internalError(res, error, 'Erro ao excluir a câmera');
  }
}
