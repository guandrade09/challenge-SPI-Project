import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BarChart2,
  AlertTriangle,
  HelpCircle,
  Eye,
  Layers,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';

// === BASE DE DADOS DOS DASHBOARDS PARA O CARROSSEL ===
const DASHBOARDS_DATA = [
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

export default function AnalisePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Categorias únicas para filtro
  const categorias = useMemo(() => {
    return ['Todas', ...new Set(DASHBOARDS_DATA.map((d) => d.categoria))];
  }, []);

  // Filtragem dos dashboards
  const filteredDashboards = useMemo(() => {
    if (selectedCategory === 'Todas') return DASHBOARDS_DATA;
    return DASHBOARDS_DATA.filter((d) => d.categoria === selectedCategory);
  }, [selectedCategory]);

  const currentDashboard = filteredDashboards[currentIndex] || filteredDashboards[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredDashboards.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredDashboards.length) % filteredDashboards.length);
  };

  return (
    <div className="min-h-screen bg-[var(--p-bg,#0f172a)] text-slate-100 p-4 md:p-8 flex flex-col font-sans transition-colors duration-300">
      {/* HEADER DA PÁGINA */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles size={14} /> Guia Executivo de Analytics
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Análise & Interpretação de Dashboards
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Visualização padronizada, objetivos dos indicadores e diretrizes de leitura para tomada de decisão.
          </p>
        </div>

        {/* FILTRO DE CATEGORIA E NAVEGAÇÃO RÁPIDA */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* CONTROLES DO CARROSSEL */}
      <div className="flex items-center justify-between mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-semibold">
            Dashboard {currentIndex + 1} de {filteredDashboards.length}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Categoria: <strong className="text-slate-200">{currentDashboard.categoria}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all disabled:opacity-40"
            title="Dashboard Anterior"
          >
            <ChevronLeft size={18} />
          </button>

          {/* INDICADORES EM PONTOS (DOTS) */}
          <div className="flex items-center gap-1.5 px-2">
            {filteredDashboards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === idx ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all"
            title="Próximo Dashboard"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* CARD PRINCIPAL (PADRÃO VISUAL EXECUTIVO) */}
      <main className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md flex flex-col gap-6">
          
          {/* BRILHO DE DEGRADÊ DE FUNDO */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* TITULO DO DASHBOARD & DESCRIÇÃO */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-bold tracking-wider text-white uppercase flex items-center gap-2">
                <BarChart2 className="text-indigo-400" size={24} />
                {currentDashboard.titulo}
              </h2>
              <span className="text-[11px] font-mono uppercase bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                {currentDashboard.tipoGrafico}
              </span>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mt-3 border-l-2 border-indigo-500 pl-3">
              {currentDashboard.descricao}
            </p>
          </div>

          {/* ESTRUTURA QUADRADA DE SEÇÕES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. PRINCIPAIS INDICADORES */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800/80 pb-2">
                <Layers size={14} />
                <span>Principais Indicadores</span>
              </div>
              <ul className="space-y-2 mt-1">
                {currentDashboard.indicadores.map((ind, idx) => (
                  <li key={idx} className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-indigo-300 font-mono font-semibold">
                      • {ind.nome}:
                    </strong>{' '}
                    {ind.descricao}
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. COMO INTERPRETAR */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800/80 pb-2">
                <Eye size={14} />
                <span>Como Interpretar</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                {currentDashboard.comoInterpretar}
              </p>
            </div>

            {/* 3. COMO LER O GRÁFICO */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800/80 pb-2">
                <Info size={14} />
                <span>Como Ler o Gráfico</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                {currentDashboard.comoLerGrafico}
              </p>
            </div>

            {/* 4. PONTOS DE ATENÇÃO */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800/80 pb-2">
                <AlertTriangle size={14} />
                <span>Pontos de Atenção</span>
              </div>
              <ul className="space-y-1.5 mt-1">
                {currentDashboard.pontosAtencao.map((ponto, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5 leading-relaxed">
                    <span className="text-amber-400 font-bold text-sm leading-none">•</span>
                    <span>{ponto}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER DE APOIO */}
      <footer className="mt-6 text-center text-xs text-slate-500 border-t border-slate-800/60 pt-4 flex items-center justify-between">
        <span>Painel de Análise Estruturada • Versão 1.0</span>
        <span className="flex items-center gap-1 text-slate-400">
          <HelpCircle size={13} /> Dúvida na leitura? Consulte o time de Analytics.
        </span>
      </footer>
    </div>
  );
}