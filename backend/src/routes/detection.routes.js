import { Router } from "express";
import { create } from "../controllers/detection.controller.js";

const router = Router();

router.post("/detections", create);

export default router;