export const REPORT_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_report_summary",
      description: "Obtém um resumo dos dados do relatório em formato estruturado (sem gerar arquivo).",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_report_pdf_info",
      description: "Obtém os dados/preview do relatório em PDF (sem baixar o arquivo).",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_report_files",
      description: "Lista os arquivos de relatório disponíveis para download.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pdf_download_link",
      description: "Gera o link de download do relatório em PDF.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_excel_download_link",
      description: "Gera o link de download do relatório em Excel.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_report_file_download_link",
      description: "Gera o link de download de um arquivo de relatório específico pelo nome do arquivo.",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "Nome do arquivo de relatório (obtido via list_report_files)",
          },
        },
        required: ["filename"],
      },
    },
  },
];