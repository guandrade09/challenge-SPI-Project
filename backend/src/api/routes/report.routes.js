// backend/src/api/routes/report.routes.js

import { Router } from "express";
import { downloadReportPdf, getReportPdf, downloadReportExcel, getReportSummary, getReportFiles, downloadReport } from "../controllers/report.controller.js";

const router = Router();

router.get("/report/pdf", getReportPdf);
router.get("/report/pdf/download", downloadReportPdf);
router.get("/report/excel/download", downloadReportExcel);
router.get("/report/pdf/summary", getReportSummary);
router.get("/report/files", getReportFiles);
router.get("/report/download/:filename", downloadReport);

export default router;
