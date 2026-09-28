const API_BASE_URL = process.env.INTERNAL_API_BASE_URL || "http://localhost:3000/api";

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

    default:
      return { error: `Tool desconhecida: ${name}` };
  }
}