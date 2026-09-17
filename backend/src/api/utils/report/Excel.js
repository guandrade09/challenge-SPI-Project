import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";

export async function generateExcelReport(detections) 
{
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Relatório");

    worksheet.columns = [
        { header: "Timestamp", key: "timestamp", width: 30 },
        { header: "Label", key: "label", width: 25 },
        { header: "Confidence", key: "confidence", width: 15 },
        { header: "Imagem", key: "img_path", width: 50 }
    ];

    worksheet.getRow(1).font = {
        bold: true
    };

    worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center"
    };

    detections.forEach((item) => 
    {
        worksheet.addRow({
            timestamp: item.timestamp,
            label: item.label,
            confidence: item.confidence,
            img_path: item.img_path
        });
    });

    return workbook;
}

export async function getExcelBuffer(workbook) 
{
    return await workbook.xlsx.writeBuffer();
}