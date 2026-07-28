// src/services/camera.service.js
import Camera from '../models/camera.model.js';
import * as cameraRepository from '../repositories/camera.repository.js';

export async function createCamera(cameraData) {
  const camera = new Camera(cameraData);
  
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

  return await cameraRepository.updateCamera(id, updatedData);
}

export async function deleteCameraById(id) {
  const existingCamera = await cameraRepository.getCameraById(id);
  if (!existingCamera) return false;

  await cameraRepository.deleteCamera(id);
  return true;
}