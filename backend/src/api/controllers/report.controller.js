import { viewReportPdf, viewReportExcel, getReportSummary as getReportSummaryService, listReportFiles, getReportFile } from "../services/report.service.js";
import { ErrorHandler } from "../utils/appError.js";

export async function downloadReportPdf(req, res) {
  try {
    const { label, start, end } = req.query;
    const pdfBuffer = await viewReportPdf(label, start, end);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=relatorio.pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function getReportPdf(req, res) {
  try {
    const { label, start, end } = req.query;
    const pdfBuffer = await viewReportPdf(label, start, end);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=relatorio.pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function downloadReportExcel(req, res) {
  try {
    const { label, start, end } = req.query;
    const excelBuffer = await viewReportExcel(label, start, end);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=relatorio.xlsx");
    res.setHeader("Content-Length", excelBuffer.length);
    return res.end(excelBuffer);
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function getReportSummary(req, res) {
  try {
    const { label, start, end } = req.query;
    const summary = await getReportSummaryService(label, start, end);
    return res.json(summary);
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function getReportFiles(req, res) {
  try {
    const { day = null, month = null, year = null } = req.query;
    const files = await listReportFiles({ day, month, year });
    return res.json(files);
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function downloadReport(req, res) {
  try {
    const filename = req.params.filename ?? req.query.filename;

    if (!filename) {
      return res.status(400).json({ error: 'Parâmetro filename é obrigatório' });
    }

    const fileBuffer = await getReportFile(filename);
    let contentType = "application/octet-stream";

    if (filename.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (filename.endsWith(".xlsx")) {
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", fileBuffer.length);
    return res.end(fileBuffer);
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}