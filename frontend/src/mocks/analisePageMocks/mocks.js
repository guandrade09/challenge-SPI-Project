// === BASE DE DADOS DOS DASHBOARDS PARA O CARROSSEL ===
export const DASHBOARDS_DATA = [
  {
    id: 'area-composta',
    titulo: 'ANÁLISE COMPOSTA',
    categoria: 'Processamento & Alertas',
    descricao:
      'Apresenta a evolução temporal dos volumes de processamento de dados e da ocorrência de alertas do sistema. Permite monitorar o fluxo operacional ao longo das horas, correlacionando o volume de dados processados com o surgimento de alertas de alta confiança.',
    indicadores: [
      { nome: 'processamento', descricao: 'Volume de registros e entradas processadas pelo sistema por hora.' },
      { nome: 'alertas', descricao: 'Quantidade de detecções confirmadas com confiança superior a 80%.' }
    ],
    comoInterpretar:
      'Observe a evolução temporal nos pontos do eixo horizontal para identificar picos de processamento e volume de alertas. Acompanhe a variação da área de processamento em relação à área de alertas para verificar o volume acumulado ao longo das horas do dia.',
    tipoGrafico: 'Gráfico de Área',
    comoLerGrafico:
      'O gráfico de área exibe a evolução contínua dos dados ao longo das horas no eixo horizontal. A altura da linha e o preenchimento sob a curva representam o volume e a dimensão acumulada de cada métrica no tempo.',
    pontosAtencao: [
      'Elevações abruptas na curva de processamento no eixo temporal.',
      'Momentos de alta concentração na curva de alertas.',
      'Discrepâncias entre o volume de processamento e a ocorrência de alertas.'
    ]
  },
  {
    id: 'deteccoes-categoria',
    titulo: 'DETECÇÕES POR CATEGORIA',
    categoria: 'Modelos de ML',
    descricao:
      'Exibe a distribuição de detecções classificadas entre confirmadas e não confirmadas para cada classe ou rótulo de evento detectado. Permite avaliar quais categorias geram mais ocorrências e a assertividade do modelo por classe.',
    indicadores: [
      { nome: 'detectado', descricao: 'Quantidade de eventos validados pelo modelo como ocorrências reais.' },
      { nome: 'naoDetectado', descricao: 'Eventos descartados ou classificados abaixo da margem de corte.' }
    ],
    comoInterpretar:
      'Compare a altura relativa das colunas entre diferentes categorias para identificar os tipos de eventos mais frequentes. Avalie a proporção entre os valores detectados e não detectados em cada rótulo individual.',
    tipoGrafico: 'Gráfico de Barras / Colunas Empilhadas',
    comoLerGrafico:
      'O tamanho e a altura das barras permitem comparar diretamente as categorias. As divisões de cores dentro de cada coluna refletem a proporção dos status de detecção no total daquela categoria.',
    pontosAtencao: [
      'Categorias com volume desproporcionalmente alto de detecções.',
      'Rótulos apresentando alta taxa de eventos não detectados.',
      'Disparidade na frequência de ocorrências entre as classes monitoradas.'
    ]
  },
  {
    id: 'termometro-incerteza',
    titulo: 'TERMÔMETRO DE INCERTEZA',
    categoria: 'Confiabilidade',
    descricao:
      'Apresenta o histograma de distribuição das pontuações de confiança das predições feitas pelo modelo. Auxilia no monitoramento da estabilidade do algoritmo e no ajuste de limiares de acionamento.',
    indicadores: [
      { nome: 'range (faixa)', descricao: 'Intervalos percentuais de confiança da predição (ex: 0-20%, 80-100%).' },
      { nome: 'quantidade', descricao: 'Total de ocorrências enquadradas dentro de cada intervalo de confiança.' }
    ],
    comoInterpretar:
      'Analise a concentração das barras nos intervalos mais altos (80-100%) para verificar a alta confiabilidade do modelo. Uma distribuição com muitas contagens nas faixas inferiores indica incerteza operacional.',
    tipoGrafico: 'Gráfico de Colunas (Histograma)',
    comoLerGrafico:
      'Cada coluna representa uma faixa de confiança. A altura da coluna indica o volume absoluto de detecções registradas naquele intervalo de probabilidade.',
    pontosAtencao: [
      'Acúmulo de registros nas faixas intermediárias ou baixas de confiança.',
      'Queda acentuada na quantidade de ocorrências na faixa de 80-100%.',
      'Mudanças repentinas no padrão de distribuição de incerteza.'
    ]
  }
];

// src/mocks/analisePageMocks/mocks.js

export const SYSTEM_PERFORMANCE_MOCKS = {
  // Dados para o DetectionComposedChart e AreaDetectionChart
  hourlyMetrics: [
    { hora: '00:00', processamento: 35, alertas: 12, precisao: 98.2 },
    { hora: '04:00', processamento: 28, alertas: 8, precisao: 99.1 },
    { hora: '08:00', processamento: 65, alertas: 34, precisao: 96.5 },
    { hora: '12:00', processamento: 88, alertas: 52, precisao: 94.8 },
    { hora: '16:00', processamento: 75, alertas: 41, precisao: 97.2 },
    { hora: '20:00', processamento: 45, alertas: 19, precisao: 98.8 },
  ],

  // Dados para o ResourceMonitor
  resourceLogs: [
    { time: '10:00', cpu: 42, paginas: 120, fullDate: '10:00:00 - Normal', threadName: 'Worker-01' },
    { time: '10:05', cpu: 58, paginas: 180, fullDate: '10:05:00 - Carga Media', threadName: 'Worker-01' },
    { time: '10:10', cpu: 85, paginas: 310, fullDate: '10:10:00 - Pico de Processamento', threadName: 'Worker-02' },
    { time: '10:15', cpu: 62, paginas: 210, fullDate: '10:15:00 - Normalizando', threadName: 'Worker-01' },
    { time: '10:20', cpu: 48, paginas: 150, fullDate: '10:20:00 - Estável', threadName: 'Worker-03' },
  ]
};