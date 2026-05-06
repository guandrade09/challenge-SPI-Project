import {
  getAllDetections,
  getDetectionsByLabel,
  getDetectionsByDay,
  getSpecificDetections
} from "../repositories/detection.repository.js";
import { GenerateReportPDF } from "../utils/report/file.js";
import { savePdfToUploads } from "../utils/folder.js";

export async function viewReport(label = null, timestamp_start = null, timestamp_end = null) {
    const detection = await GetDataForReport(label, timestamp_start, timestamp_end);
    const reportPDF = await GenerateReportPDF(detection);
    
    await savePdfToUploads(reportPDF);        
    
    return reportPDF;
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