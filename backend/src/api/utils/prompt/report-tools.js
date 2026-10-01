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
  {
    type: "function",
    function: {
      name: "get_detection_stats",
      description:
        "Obtém estatísticas das ocorrências detectadas: total, quantas foram confirmadas (uso correto identificado) e quantas não foram confirmadas (ausência do equipamento ou baixa confiança), além da confiança média. Pode filtrar por um equipamento específico.",
      parameters: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "Nome do equipamento para filtrar (ex: Capacete, Colete, Oculos). Deixe vazio para trazer todos.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_detections_by_day",
      description: "Obtém as ocorrências registradas em um dia específico, com estatísticas resumidas e uma amostra dos registros mais recentes daquele dia.",
      parameters: {
        type: "object",
        properties: {
          day: {
            type: "string",
            description: "Data no formato AAAA-MM-DD (ex: 2026-09-01).",
          },
        },
        required: ["day"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_thread_metrics_summary",
      description:
        "Obtém um resumo de quanto processamento cada parte do sistema está consumindo (o que atende as câmeras/registro de dados, a tela do usuário, ou a inteligência artificial), incluindo média, mínimo, máximo e a leitura mais recente.",
      parameters: {
        type: "object",
        properties: {
          thread_name: {
            type: "string",
            enum: ["backend_processor", "renderFrontend_pages", "machineLearning_processor"],
            description:
              "Parte do sistema a consultar: backend_processor (registro e regras do sistema), renderFrontend_pages (tela vista pelo usuário) ou machineLearning_processor (inteligência artificial). Deixe vazio para trazer o resumo de todas.",
          },
        },
        required: [],
      },
    },
  },
];