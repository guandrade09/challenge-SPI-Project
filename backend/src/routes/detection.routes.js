import { Router } from "express";
import { create, list, getByLabel } from "../controllers/detection.controller.js";

const router = Router();

router.post("/detections", create);
router.get("/detections", list);
router.get("/detections/:label", getByLabel);

export default router;