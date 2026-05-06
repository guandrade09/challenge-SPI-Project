import { Router } from "express";
import { downloadReport, getReport } from "../controllers/report.controller.js";

const router = Router();

router.get("/report", getReport);
router.get("/report/download", downloadReport);

export default router;
