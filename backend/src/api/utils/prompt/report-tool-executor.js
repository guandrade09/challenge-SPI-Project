const API_BASE_URL = process.env.INTERNAL_API_BASE_URL || "http://localhost:3000/api";
const CONFIDENCE_THRESHOLD = 0.6;

async function callEndpoint(pathname) {
  const response = await fetch(`${API_BASE_URL}${pathname}`);
  if (!response.ok) {
    throw new Error(`Erro ao chamar ${pathname}: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return { url: `${API_BASE_URL}${pathname}` };
}

function asArray(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

// Mesma regra usada nos gráficos do frontend (src/utils/detectionStatus.js):
// só é considerada confirmada quando o equipamento não está marcado como ausente
// e a confiança é suficiente. Confiança baixa ou ausência -> não confirmada.
function isDetectionConfirmed(item) {
  const epiAusente = item?.epi_ausente;
  if (epiAusente === true || epiAusente === 1 || epiAusente === "1") return false;

  const confidence = parseFloat(item?.confidence);
  return !isNaN(confidence) && confidence >= CONFIDENCE_THRESHOLD;
}

function summarizeDetections(items) {
  const byLabel = {};
  let confirmadas = 0;
  let naoConfirmadas = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;

  items.forEach((item) => {
    const label = item.label || "Desconhecido";
    if (!byLabel[label]) byLabel[label] = { label, total: 0, confirmadas: 0, naoConfirmadas: 0 };
    byLabel[label].total += 1;

    if (isDetectionConfirmed(item)) {
      byLabel[label].confirmadas += 1;
      confirmadas += 1;
    } else {
      byLabel[label].naoConfirmadas += 1;
      naoConfirmadas += 1;
    }

    const confidence = parseFloat(item.confidence);
    if (!isNaN(confidence)) {
      confidenceSum += confidence;
      confidenceCount += 1;
    }
  });

  return {
    total: items.length,
    confirmadas,
    naoConfirmadas,
    confiancaMedia: confidenceCount > 0 ? Number((confidenceSum / confidenceCount).toFixed(3)) : null,
    porEquipamento: Object.values(byLabel),
  };
}

function summarizeThreadMetrics(items) {
  if (items.length === 0) {
    return { amostras: 0, cpuMedio: null, cpuMaximo: null, cpuMinimo: null, ultimaLeitura: null, porThread: [] };
  }

  const sorted = [...items].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const cpuValues = sorted.map((item) => Number(item.quantity_of_cpu_ind_percentage) || 0);
  const last = sorted[sorted.length - 1];

  const grouped = {};
  sorted.forEach((item) => {
    const key = item.thread_name || "geral";
    if (!grouped[key]) grouped[key] = { thread_name: key, amostras: 0, cpuSum: 0 };
    grouped[key].amostras += 1;
    grouped[key].cpuSum += Number(item.quantity_of_cpu_ind_percentage) || 0;
  });

  return {
    amostras: sorted.length,
    cpuMedio: Number((cpuValues.reduce((sum, value) => sum + value, 0) / cpuValues.length).toFixed(2)),
    cpuMaximo: Math.max(...cpuValues),
    cpuMinimo: Math.min(...cpuValues),
    ultimaLeitura: {
      timestamp: last.timestamp,
      thread_name: last.thread_name,
      cpu: last.quantity_of_cpu_ind_percentage,
      processos: last.process_loaded,
    },
    porThread: Object.values(grouped).map((group) => ({
      thread_name: group.thread_name,
      amostras: group.amostras,
      cpuMedio: Number((group.cpuSum / group.amostras).toFixed(2)),
    })),
  };
}

export async function executeReportTool(name, args) {
  switch (name) {
    case "get_report_summary":
      return callEndpoint("/report/pdf/summary");

    case "get_report_pdf_info":
      return callEndpoint("/report/pdf");

    case "list_report_files":
      return callEndpoint("/report/files");

    case "get_pdf_download_link":
      return { url: `${API_BASE_URL}/report/pdf/download` };

    case "get_excel_download_link":
      return { url: `${API_BASE_URL}/report/excel/download` };

    case "get_report_file_download_link": {
      if (!args?.filename) {
        return { error: "filename é obrigatório" };
      }
      return { url: `${API_BASE_URL}/report/download/${encodeURIComponent(args.filename)}` };
    }

    case "get_detection_stats": {
      const pathname = args?.label ? `/detections/${encodeURIComponent(args.label)}` : "/detections";
      const items = asArray(await callEndpoint(pathname));
      return summarizeDetections(items);
    }

    case "get_detections_by_day": {
      if (!args?.day) {
        return { error: "day é obrigatório (formato AAAA-MM-DD)" };
      }
      const items = asArray(await callEndpoint("/detections"));
      const dayItems = items.filter((item) => item.timestamp && String(item.timestamp).slice(0, 10) === args.day);
      const amostras = dayItems.slice(-20).map((item) => ({
        timestamp: item.timestamp,
        label: item.label,
        confidence: item.confidence,
        epi_ausente: item.epi_ausente,
        setor: item.setor,
        camera_id: item.camera_id,
        criticidade: item.criticidade,
      }));

      return { dia: args.day, ...summarizeDetections(dayItems), amostras };
    }

    case "get_thread_metrics_summary": {
      const threadName = args?.thread_name;
      const pathname = threadName ? `/threads/name/${encodeURIComponent(threadName)}` : "/threads";
      const items = asArray(await callEndpoint(pathname));
      return { thread_name: threadName || "todas", ...summarizeThreadMetrics(items) };
    }

    default:
      return { error: `Tool desconhecida: ${name}` };
  }
}