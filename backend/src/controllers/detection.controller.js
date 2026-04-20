import { createDetection } from "../services/detection.service.js";

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