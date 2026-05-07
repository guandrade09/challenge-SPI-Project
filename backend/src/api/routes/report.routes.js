import { Router } from "express";
import { downloadReportPdf, getReportPdf, downloadReportExcel } from "../controllers/report.controller.js";

const router = Router();

router.get("/report/pdf", getReportPdf);
router.get("/report/pdf/download", downloadReportPdf);
router.get("/report/excel/download", downloadReportExcel);


export default router;