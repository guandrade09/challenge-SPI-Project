import {
  getAllDetections,
  getDetectionsByLabel,
  getDetectionsByDay,
  getSpecificDetections
} from "../repositories/detection.repository.js";
import { GenerateReportPDF, GetPredictionData} from "../utils/report/file.js";
import { generateExcelReport, getExcelBuffer } from "../utils/report/excel.js";
import { savePdfToUploads , saveExcel } from "../utils/folder.js";

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