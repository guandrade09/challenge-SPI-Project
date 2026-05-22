import { searchAllConfidenceDetail, searchConfidenceDetailsByDay } from "../repositories/confidence.repository.js";

//#region :: GET METHODS ::
export async function searchConfidence() 
{
  return await searchAllConfidenceDetail();
}

export async function searchConfidenceByDay(timestamp) 
{
  return await searchConfidenceDetailsByDay(timestamp);
}
//#endregion