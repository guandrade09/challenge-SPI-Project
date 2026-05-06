import { viewReport } from "../services/report.service.js";
import { ErrorHandler } from "../utils/appError.js";

export async function downloadReport(req, res) {
  const { label, start, end } = req.query;

  const pdfBuffer = await viewReport(label, start, end);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=relatorio.pdf");
  res.setHeader("Content-Length", pdfBuffer.length);

  res.end(pdfBuffer);
}

export async function getReport(req, res) {
  const { label, start, end } = req.query;

  const pdfBuffer = await viewReport(label, start, end);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=relatorio.pdf");
  res.setHeader("Content-Length", pdfBuffer.length);

  res.end(pdfBuffer);
}