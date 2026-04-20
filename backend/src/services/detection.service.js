import Detection from "../models/detection.model.js";
import { saveDetection } from "../repositories/detection.repository.js";

export async function createDetection(data) {
  const detection = new Detection(data);

  // Validação simples (você pode evoluir isso)
  if (!detection.label || !detection.confidence) {
    throw new Error("Dados inválidos");
  }

  await saveDetection(detection);

  return detection;
}