import { timeStamp } from "node:console";
import { searchConfidence, searchConfidenceByDay } from "../services/confidenceLog.service.js";

export async function getConfidenceDetails(req, res) {
  const data = await searchConfidence();
  return res.json(data);
}

export async function getByDay(req, res) {
  const { day } = req.params;

  const data = await searchConfidenceByDay(day);

  if (!data) {
    return res.status(404).json({ message: "Não encontrado" });
  }

  return res.json(data);
}