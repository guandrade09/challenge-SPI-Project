// src/controllers/camera.controller.js
import * as cameraService from "../services/camera.service.js";

export async function createCamera(req, res) {
  try {
    const camera = await cameraService.createCamera(req.body);
    return res.status(201).json({ message: 'Câmera criada com sucesso', data: camera });
  } catch (error) {
    console.error("ERRO EXATO DO SERVIDOR:", error);
    return res.status(500).json({
      message: 'Erro ao criar a câmera',
      error: error.message
    });
  }
}

export async function listCameras(req, res) {
  try {
    const cameras = await cameraService.listCameras();
    return res.status(200).json({ count: cameras.length, data: cameras });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar as câmeras', error: error.message });
  }
}

export async function getCamera(req, res) {
  try {
    const { id } = req.params;
    const camera = await cameraService.getCamera(id);
    if (!camera) {
      return res.status(404).json({ message: 'Câmera não encontrada' });
    }
    return res.status(200).json({ data: camera });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar a câmera', error: error.message });
  }
}

export async function updateCameraById(req, res) {
  try {
    const { id } = req.params;
    const updatedCamera = await cameraService.updateCameraById(id, req.body);
    if (!updatedCamera) {
      return res.status(404).json({ message: 'Câmera não encontrada' });
    }
    return res.status(200).json({ message: 'Câmera atualizada com sucesso', data: updatedCamera });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar a câmera', error: error.message });
  }
}

export async function deleteCameraById(req, res) {
  try {
    const { id } = req.params;
    const success = await cameraService.deleteCameraById(id);
    if (!success) {
      return res.status(404).json({ message: 'Câmera não encontrada' });
    }
    return res.status(200).json({ message: 'Câmera excluída com sucesso' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao excluir a câmera', error: error.message });
  }
}