// src/services/camera.service.js
import Camera from '../models/camera.model.js';
import * as cameraRepository from '../repositories/camera.repository.js';

export async function createCamera(cameraData) {
  const camera = new Camera(cameraData);
  await ensureUniqueStreamKey(camera);
  const savedCamera = await cameraRepository.saveCamera(camera);
  return savedCamera;
}

export async function listCameras() {
  return await cameraRepository.getAllCameras();
}

export async function getCamera(id) {
  return await cameraRepository.getCameraById(id);
}

export async function updateCameraById(id, cameraData) {
  const existingCamera = await cameraRepository.getCameraById(id);
  if (!existingCamera) return null;

  const updatedData = new Camera({
    ...existingCamera,
    ...cameraData,
    updatedAt: new Date().toISOString()
  });

  await ensureUniqueStreamKey(updatedData, id);

  return await cameraRepository.updateCamera(id, updatedData);
}

export async function deleteCameraById(id) {
  const existingCamera = await cameraRepository.getCameraById(id);
  if (!existingCamera) return false;

  await cameraRepository.deleteCamera(id);
  return true;
}

async function ensureUniqueStreamKey(camera, excludeId = null) {
  if (!camera.setor) return;
  const papel = camera.papel || 'frontal';
  const duplicate = await cameraRepository.getCameraBySectorAndRole(camera.setor, papel, excludeId);
  if (!duplicate) return;
  const error = new Error(`O setor "${camera.setor}" já possui uma câmera ${papel}`);
  error.statusCode = 409;
  throw error;
}
