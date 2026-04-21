import Confidence from "../models/confidenceLog.model.js";
import { searchAllConfidenceDetail, searchConfidenceDetailsByDay } from "../repositories/confidenceLog.repository.js";


export async function searchConfidence() 
{
  return await searchAllConfidenceDetail();
}

export async function searchConfidenceByDay(timestamp) 
{
  return await searchConfidenceDetailsByDay(timestamp);
}