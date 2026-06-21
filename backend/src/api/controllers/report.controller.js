import { viewReportPdf, viewReportExcel, getReportSummary as getReportSummaryService, listReportFiles, getReportFile } from "../services/report.service.js";
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

export async function getReportFiles(req, res) {
  try {
    const { day = null, month = null, year = null } = req.query;
    const files = await listReportFiles({ day, month, year });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar arquivos de relatórios' });
  }
}

export async function downloadReport(req, res) {
  const filename = req.params.filename ?? req.query.filename;

  if (!filename) {
    return res.status(400).json({ error: 'Parâmetro filename é obrigatório' });
  }

  let fileBuffer;
  try {
    fileBuffer = await getReportFile(filename);

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
  } catch (err) {
    console.error(err);
    return res.status(404).json({ error: `Arquivo não encontrado: ${filename}` });
  }
}