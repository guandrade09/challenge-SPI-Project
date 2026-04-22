import { timeStamp } from "node:console";
import { searchConfidence, searchConfidenceByDay } from "../services/confidence.service.js";

export async function getConfidenceDetails(req, res) 
{
  try
  {
    const data = await searchConfidence();
    return res.json(data);
  }
  catch (error) 
  {
    return res.status(400).json({
      error: error.message,
    });
  }
}

export async function getByDay(req, res) 
{
  try
  {

      const { day } = req.params;

      const data = await searchConfidenceByDay(day);

      if (!data) {
        return res.status(404).json({ message: "Não encontrado" });
      }

      return res.json(data);
  }
  catch (error) 
  {
    return res.status(400).json({
      error: error.message,
    });
  }
}