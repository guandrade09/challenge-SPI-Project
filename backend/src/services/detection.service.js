import Detection from "../models/detection.model.js";
import { saveDetection, viewAllDetection, viewDetectionByLabel } from "../repositories/detection.repository.js";

//#region :: POST METHODS ::
export async function createDetection(data) {
  const detection = new Detection(data);

  if (!detection.label || !detection.confidence || 
      !detection.img_Frame || !detection.img_Path || !detection.timestamp ) {
    throw new Error("Dados inválidos");
  }

  await saveDetection(detection);
  return detection;
}
//#endregion 

//#region :: GET METHODS ::
export async function viewDetection() 
{
  return await viewAllDetection();
}

export async function searchDetection(label) 
{
  return await viewDetectionByLabel(label);
}
//#endregion