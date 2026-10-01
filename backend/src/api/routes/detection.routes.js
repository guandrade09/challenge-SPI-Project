import { Router } from "express";
import { create, list, getByLabel, getByTimestamp, remove } from "../controllers/detection.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/detections", create);
router.get("/detections", list);
router.delete("/detections", authMiddleware, remove);
router.get("/detections/:label", getByLabel);
router.get("/detections/:timestamp", getByTimestamp);

export default router;
