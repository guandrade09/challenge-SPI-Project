// Fontes de métricas de processamento monitoradas pelo sistema.
export const THREAD_OPTIONS = [
  { id: "backend_processor", label: "Backend" },
  { id: "renderFrontend_pages", label: "Frontend" },
  { id: "machineLearning_processor", label: "ML" },
];

export function getThreadLabel(threadId) {
  return THREAD_OPTIONS.find((option) => option.id === threadId)?.label ?? threadId;
}

export function getThreadMetricsConfig(threadId) {
  if (threadId === "renderFrontend_pages") {
    return [
      { key: "cpu", name: "% HeapJS", stroke: "var(--chart-line-1)", yAxisId: "left" },
      { key: "paginas", name: "Páginas Carregadas", stroke: "var(--chart-line-2)", yAxisId: "right" },
    ];
  }

  if (threadId === "machineLearning_processor") {
    return [
      { key: "cpu", name: "% CPU (ML)", stroke: "var(--chart-line-1)", yAxisId: "left" },
      { key: "paginas", name: "Quantidade de Processos", stroke: "var(--chart-line-2)", yAxisId: "right" },
    ];
  }

  return [
    { key: "cpu", name: "% CPU", stroke: "var(--chart-line-1)", yAxisId: "left" },
    { key: "paginas", name: "Quantidade de Processos", stroke: "var(--chart-line-2)", yAxisId: "right" },
  ];
}
