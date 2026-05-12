import { viewReportPdf, viewReportExcel, getReportSummary as getReportSummaryService } from "../services/report.service.js";
import { ErrorHandler } from "../utils/appError.js";

export async function downloadReportPdf(req, res) {
  const { label, start, end } = req.query;

  const pdfBuffer = await viewReportPdf(label, start, end);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=relatorio.pdf");
  res.setHeader("Content-Length", pdfBuffer.length);

  res.end(pdfBuffer);
}

export async function getReportPdf(req, res) {
  const { label, start, end } = req.query;

  const pdfBuffer = await viewReportPdf(label, start, end);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=relatorio.pdf");
  res.setHeader("Content-Length", pdfBuffer.length);

  res.end(pdfBuffer);
}

export async function downloadReportExcel(req, res) {
  const { label, start, end } = req.query;

  const excelBuffer = await viewReportExcel(label, start, end);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=relatorio.xlsx");
  res.setHeader("Content-Length", excelBuffer.length);

  res.end(excelBuffer);
}

export async function getReportSummary(req, res) {
    const { label, start, end } = req.query;
    const summary = await getReportSummaryService(label, start, end);
    res.json(summary);
}
