import { Router } from "express";
import { getConfidenceDetails, getByDay } from "../controllers/confidenceLog.controller.js";

const router = Router();

router.get("/confidence", getConfidenceDetails);
router.get("/confidence/:day", getByDay);

export default router;