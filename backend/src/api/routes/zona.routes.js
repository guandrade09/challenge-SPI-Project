import { Router } from "express";
import { save, get, remove } from "../controllers/zona.controller.js";

const router = Router();

router.post("/zonas", save);
router.get("/zonas/:camera_id", get);
router.delete("/zonas/:camera_id", remove);

export default router;
