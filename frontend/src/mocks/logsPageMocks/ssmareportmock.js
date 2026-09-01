// src/mocks/logsPageMocks/ssmaReportMock.js
// Mock de relatório SSMA gerado para apresentação

export const ssmaReportMock = {
  status: "sucesso",
  data_geracao: "22/06/2026 14:35",
  turno: "Turno A — 06:00 às 14:00",
  camera: "cam_01 — Área de Montagem",

  // ── Resumo executivo ────────────────────────────────────────────────────
  resumo_executivo:
    "O sistema de monitoramento registrou 8 horas de operação contínua com " +
    "latência média de 38ms. Foram identificados 3 eventos críticos de EPI " +
    "e 1 postura de risco ALTO (REBA ≥ 8). Nenhuma queda foi confirmada no " +
    "período. Recomenda-se revisão imediata do procedimento de uso de óculos " +
    "de proteção na Área de Montagem.",

  // ── Ergonomia / REBA ────────────────────────────────────────────────────
  ergonomia: {
    reba_medio_turno: 4.2,
    reba_maximo:      9,
    distribuicao: [
      { nivel: "BAIXO (1–3)",  percentual: 58, cor: "#3cc87a" },
      { nivel: "MÉDIO (4–7)",  percentual: 35, cor: "#d4a017" },
      { nivel: "ALTO (8–15)",  percentual: 7,  cor: "#e05252" },
    ],
    eventos_alto_risco: 4,
    postura_mais_frequente: "Flexão moderada de tronco (score 3)",
    recomendacoes: [
      "Revisar altura da bancada de trabalho conforme NR-17 §5.3",
      "Implementar pausas de 10min a cada 50min de trabalho contínuo",
      "Avaliar uso de suporte lombar para operadores da linha de montagem",
    ],
  },

  // ── EPIs ────────────────────────────────────────────────────────────────
  epis: {
    total_alertas: 11,
    conformidade_geral: 78,
    por_epi: [
      { nome: "Capacete",  alertas: 2, conformidade: 92, cor: "#3cc87a" },
      { nome: "Óculos",    alertas: 6, conformidade: 61, cor: "#e05252" },
      { nome: "Colete",    alertas: 1, conformidade: 88, cor: "#3cc87a" },
      { nome: "Máscara",   alertas: 2, conformidade: 75, cor: "#d4a017" },
      { nome: "Auricular", alertas: 0, conformidade: 100, cor: "#3cc87a" },
      { nome: "Botas",     alertas: 0, conformidade: 100, cor: "#3cc87a" },
    ],
    epi_critico: "Óculos de proteção (61% de conformidade)",
    recomendacoes: [
      "Fiscalizar uso de óculos de proteção — índice abaixo do mínimo aceitável (80%)",
      "Reforçar treinamento sobre obrigatoriedade de EPIs na Área de Montagem",
      "Verificar disponibilidade de estoque de óculos na entrada da área",
    ],
  },

  // ── Zona de risco ───────────────────────────────────────────────────────
  zona: {
    nome: "Área de Montagem — Setor B",
    total_invasoes: 7,
    tempo_medio_invasao_seg: 12,
    invasoes_sem_epi: 3,
    horario_pico: "10:00–11:00",
    recomendacoes: [
      "Instalar barreira física adicional no acesso ao Setor B",
      "Revisar sinalização de EPI obrigatório na entrada da zona",
    ],
  },

  // ── Quedas ──────────────────────────────────────────────────────────────
  quedas: {
    total_detectadas: 1,
    confirmadas: 0,
    falsos_alarmes: 1,
    nota: "O evento registrado foi classificado como falso alarme após revisão manual.",
  },

  // ── Performance do sistema ──────────────────────────────────────────────
  sistema: {
    latencia_media_ms: 38,
    latencia_maxima_ms: 142,
    pck_pose_medio: 0.71,
    frames_processados: 86400,
    uptime_percentual: 99.8,
  },

  // ── Classificação geral SSMA ────────────────────────────────────────────
  classificacao: {
    score: 74,          // 0–100
    nivel: "REGULAR",   // CRÍTICO | REGULAR | BOM | EXCELENTE
    cor: "#d4a017",
    parecer:
      "O turno apresentou conformidade abaixo do esperado em EPIs visuais " +
      "(óculos). A ergonomia está em nível aceitável, porém com eventos " +
      "pontuais de risco ALTO que requerem atenção. Recomenda-se plano de " +
      "ação corretiva para o próximo turno.",
  },
};