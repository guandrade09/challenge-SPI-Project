import {
  getAllDetections,
  getDetectionsByLabel,
  getDetectionsByDay,
  getSpecificDetections
} from "../repositories/detection.repository.js";
import {
  GenerateReportPDF,
  GetPredictionData,
  OrganizeDataForReport,
  calculateAccuracy,
} from "../utils/report/file.js";
import { generateExcelReport, getExcelBuffer } from "../utils/report/excel.js";
import { savePdfToUploads, saveExcel } from "../utils/folder.js";

export async function viewReportPdf(label = null, timestamp_start = null, timestamp_end = null) {
    const detectionAll = await getAllDetections();
    const detection = await GetDataForReport(label, timestamp_start, timestamp_end);
    const predict = await GetPredictionData(detectionAll);
    const reportPDF = await GenerateReportPDF(detection);
    
    await savePdfToUploads(reportPDF);        
    
    return reportPDF;
}

export async function viewReportExcel(label = null, timestamp_start = null, timestamp_end = null) {
    const detection = await GetDataForReport(label, timestamp_start, timestamp_end);    
    const reportExcel = await generateExcelReport(detection);
    await saveExcel(reportExcel);
    return await getExcelBuffer(reportExcel);
}

async function GetDataForReport(label, timestamp_start, timestamp_end) {
    if (label != null && timestamp_start != null && timestamp_end != null) {
        return await getSpecificDetections(label, timestamp_start, timestamp_end);
    }

    if (label != null) {
        return await getDetectionsByLabel(label);
    }
    if (timestamp_start != null && timestamp_end != null) {
        return await getDetectionsByDay(timestamp_start, timestamp_end);
    }
    return await getAllDetections();
}

export async function getReportSummary(label = null, timestamp_start = null, timestamp_end = null) {
    const detectionAll = await getAllDetections();
    const detection = await GetDataForReport(label, timestamp_start, timestamp_end);
    const counts = await OrganizeDataForReport(detection);
    const accuracy = await calculateAccuracy(detection);
    const prob = await GetPredictionData(detectionAll);

    return {
        status: "PRONTO",
        data_geracao: new Date().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // Garante formato 24h
            }),
        resumo: `Total: ${counts.total} | Capacete: ${counts.capacete} | Colete: ${counts.colete} | Máscara: ${counts.mascara} | Óculos: ${counts.oculos} | Acertos: ${accuracy.acertos} | Erros: ${accuracy.erros} | Maior prob: ${prob.prediction} (${(prob.probability * 100).toFixed(1)}%)`,
        counts,
        accuracy,
        probabilities: prob.probabilities,
        prediction: prob.prediction,
        probability: prob.probability,
    };
}
