// src/components/graficos/utils/Config.js

export const defaultConfigResourceMonitor = [
  { 
    key: "cpu", 
    name: "Consumo CPU / Heap (%)", 
    stroke: "var(--chart-line-1)", 
    yAxisId: "left" 
  },
  { 
    key: "paginas", 
    name: "Carga de Processos / Páginas", 
    stroke: "var(--chart-line-2)", 
    yAxisId: "right" 
  },
];