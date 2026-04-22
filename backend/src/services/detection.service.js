import Detection from "../models/detection.model.js";
import { saveDetection, viewAllDetection, viewDetectionByLabel, viewDetectionByDay } from "../repositories/detection.repository.js";

//#region :: POST METHODS ::
 
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

export async function searchDetectionByDay(day) 
{
  return await viewDetectionByDay(day);
}
//#endregion