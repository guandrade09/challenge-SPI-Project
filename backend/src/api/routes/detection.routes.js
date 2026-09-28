import { Router } from "express";
import { create, list, getByLabel, getByTimestamp } from "../controllers/detection.controller.js";

const router = Router();

router.post("/detections", create);
router.get("/detections", list);
router.get("/detections/:label", getByLabel);
router.get("/detections/:timestamp", getByTimestamp);

export default router;