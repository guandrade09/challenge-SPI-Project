import { createDetection, viewDetection, searchDetection } from "../services/detection.service.js";

export async function create(req, res) {
  try {
    const detection = await createDetection(req.body);

    return res.status(201).json({
      message: "Detection salva com sucesso",
      data: detection,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
}

export async function list(req, res) {
  const data = await viewDetection();
  return res.json(data);
}

export async function getByLabel(req, res) {
  const { label } = req.params;

  const data = await searchDetection(label);

  if (!data) {
    return res.status(404).json({ message: "Não encontrado" });
  }

  return res.json(data);
}