import logMonitorService from "../../services/log-monitor.service.js";

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
    ? entries.map((entry) => ({
        timestamp: formatLogTimestamp(entry.timestamp),
        line: entry.line ?? entry.logs ?? entry.message ?? "",
      }))
    : [];
}
