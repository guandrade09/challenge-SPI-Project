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
    const directories = [
        path.resolve("backend/src/api/uploads/relatorios/pdf"),
        path.resolve("backend/src/api/uploads/relatorios/excel")
    ];

    const results = [];

    for (const dir of directories) {
        await readDirectory(dir);
    }

    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getReportFile(filename) {
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) {
        throw new Error('Nome de arquivo inválido');
    }

    let directory = null;
    if (filename.endsWith('.pdf')) {
        directory = path.resolve('backend/src/api/uploads/relatorios/pdf');
    } else if (filename.endsWith('.xlsx')) {
        directory = path.resolve('backend/src/api/uploads/relatorios/excel');
    } else {
        throw new Error('Tipo de arquivo não suportado');
    }

    const filePath = path.join(directory, filename);
    return fs.readFileSync(filePath);
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

async function readDirectory(dir) 
{
    try {
        if (!fs.existsSync(dir)) return;

        const files = await fs.promises.readdir(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = await fs.promises.stat(fullPath);

            if (!stat.isFile()) continue;

            const date = getFileDate(file, stat.mtime);

            if (!matchesFilter(date)) continue;

            results.push({
                fileName: file,
                size: stat.size,
                date: date.toISOString(),
                type: path.extname(file).slice(1).toLowerCase()
            });
        }
    } 
    catch 
    {
    }
}

function matchesFilter(date) 
{
    if (!date || isNaN(date.getTime())) {
        return !day && !month && !year;
    }

    const filters = {
        day: date.getUTCDate(),
        month: date.getUTCMonth() + 1,
        year: date.getUTCFullYear()
    };

    return (
        (!day || Number(day) === filters.day) &&
        (!month || Number(month) === filters.month) &&
        (!year || Number(year) === filters.year)
    );
}

function getFileDate(fileName, fallbackDate) {
    return (
        parseIsoDate(fileName) ||
        parseTimestamp(fileName, 13) ||
        parseTimestamp(fileName, 10, true) ||
        new Date(fallbackDate)
    );
}

function parseIsoDate(text) {
    const match = text.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(?:-\d+)?Z?/);

    if (!match) return null;

    let timestamp = match[0];
    const hasZ = timestamp.endsWith("Z");

    if (hasZ) {
        timestamp = timestamp.slice(0, -1);
    }

    const [datePart, timePart] = timestamp.split("T");
    const [hh = "00", mm = "00", ss = "00", ms = "0"] = timePart.split("-");

    const iso = `${datePart}T${hh}:${mm}:${ss}.${ms}${hasZ ? "Z" : ""}`;
    const date = new Date(iso);

    return isNaN(date) ? null : date;
}

function parseTimestamp(text, digits, seconds = false) {
    const match = text.match(new RegExp(`(\\d{${digits}})`));

    if (!match) return null;

    let value = Number(match[1]);

    if (seconds) {
        value *= 1000;
    }

    const date = new Date(value);

    return isNaN(date) ? null : date;
}