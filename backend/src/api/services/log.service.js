import logMonitorService, { identifyLogEntries } from "../../services/log-monitor.service.js";
import { AppError } from "../utils/appError.js";

function formatLogTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value ?? "";
  }

  const datePart = date.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const timePart = date.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${datePart}/${timePart}`;
}

export async function readLogs() {
  const entries = await logMonitorService.readEntries();
  return Array.isArray(entries)
    ? identifyLogEntries(entries).map((entry) => ({
        id: entry.id,
        timestamp: formatLogTimestamp(entry.timestamp),
        rawTimestamp: entry.timestamp,
        line: entry.line ?? entry.logs ?? entry.message ?? "",
      }))
    : [];
}

export async function deleteLog(id) {
  if (typeof id !== 'string' || !/^(?:[a-f0-9-]{36}|legacy-[a-f0-9]{64}-\d+)$/.test(id)) {
    throw new AppError("Informe um ID válido de log.", 400);
  }
  if (!await logMonitorService.removeEntry(id)) throw new AppError("Log não encontrado.", 404);
  return { deletedRows: 1 };
}
