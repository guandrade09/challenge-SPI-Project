import { upsertZona, getZona, removeZona } from "../services/zona.service.js";

export async function save(req, res) {
  try {
    const zona = await upsertZona(req.body);
    res.status(200).json({ ok: true, ...zona });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

export async function get(req, res) {
  try {
    const zona = await getZona(req.params.camera_id);
    if (!zona) return res.status(404).json({ erro: "Zona não encontrada" });
    res.json(zona);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

export async function remove(req, res) {
  try {
    const removed = await removeZona(req.params.camera_id);
    if (!removed) return res.status(404).json({ erro: "Zona não encontrada" });
    res.json({ ok: true, camera_id: req.params.camera_id });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}
