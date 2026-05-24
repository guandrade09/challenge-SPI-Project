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
import fs from "fs";
import path from "path";

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

export async function listReportFiles({ day = null, month = null, year = null } = {}) {
    const pdfDir = path.resolve("backend/src/api/uploads/relatorios/pdf");
    const excelDir = path.resolve("backend/src/api/uploads/relatorios/excel");

    const results = [];

    async function readDir(dir) {
        try {
            if (!fs.existsSync(dir)) return;
            const names = await fs.promises.readdir(dir);
            for (const name of names) {
                const full = path.join(dir, name);
                const stat = await fs.promises.stat(full);
                if (!stat.isFile()) continue;

                const dateValue = parseDateFromFileName(name) || stat.mtime.toISOString();
                const dateObj = new Date(dateValue);
                if (!shouldInclude(dateObj, day, month, year)) continue;

                results.push({
                    fileName: name,
                    size: stat.size,
                    date: dateValue,
                    type: path.extname(name).replace('.', '').toLowerCase()
                });
            }
        } catch (err) {
            // ignore folder access errors
        }
    }

    function shouldInclude(dateObj, day, month, year) {
        if (!dateObj || isNaN(dateObj.getTime())) {
            return !day && !month && !year;
        }

        const utcDay = dateObj.getUTCDate();
        const utcMonth = dateObj.getUTCMonth() + 1;
        const utcYear = dateObj.getUTCFullYear();

        if (year && Number(year) !== utcYear) return false;
        if (month && Number(month) !== utcMonth) return false;
        if (day && Number(day) !== utcDay) return false;
        return true;
    }

    function parseDateFromFileName(name) {
        // Try ISO-like timestamp (e.g. 2023-05-20T12-34-56-789Z)
        const isoLike = name.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(?:-\d+)?Z?/);
        if (isoLike) {
            let ts = isoLike[0];
            const hasZ = ts.endsWith("Z");
            if (hasZ) ts = ts.slice(0, -1);
            const [datePart, timePart] = ts.split('T');
            const timePieces = timePart.split('-');
            const hh = timePieces[0] || '00';
            const mm = timePieces[1] || '00';
            const ss = timePieces[2] || '00';
            const ms = timePieces[3] || '0';
            const iso = `${datePart}T${hh}:${mm}:${ss}.${ms}${hasZ ? 'Z' : ''}`;
            const d = new Date(iso);
            if (!isNaN(d)) return d.toISOString();
        }

        // Try millisecond timestamp (13 digits)
        const msMatch = name.match(/(\d{13})/);
        if (msMatch) {
            const v = Number(msMatch[1]);
            const d = new Date(v);
            if (!isNaN(d)) return d.toISOString();
        }

        // Try seconds timestamp (10 digits)
        const sMatch = name.match(/(\d{10})/);
        if (sMatch) {
            const v = Number(sMatch[1]) * 1000;
            const d = new Date(v);
            if (!isNaN(d)) return d.toISOString();
        }

        return null;
    }
    function shouldInclude(dateObj, day, month, year) {
        if (!dateObj || isNaN(dateObj.getTime())) {
            return !day && !month && !year;
        }

        const utcDay = dateObj.getUTCDate();
        const utcMonth = dateObj.getUTCMonth() + 1;
        const utcYear = dateObj.getUTCFullYear();

        if (year && Number(year) !== utcYear) return false;
        if (month && Number(month) !== utcMonth) return false;
        if (day && Number(day) !== utcDay) return false;
        return true;
    }
    await readDir(pdfDir);
    await readDir(excelDir);

    // sort by date desc
    results.sort((a, b) => new Date(b.date) - new Date(a.date));

    return results;
}
