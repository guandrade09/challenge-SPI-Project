import { searchAllConfidenceDetail, searchConfidenceDetailsByDay } from "../repositories/confidence.repository.js";


export async function searchConfidence() 
{
  return await searchAllConfidenceDetail();
}

export async function searchConfidenceByDay(timestamp) 
{
  return await searchConfidenceDetailsByDay(timestamp);
}