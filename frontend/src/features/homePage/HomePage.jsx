import { useEffect, useState } from "react";
import { useDataStore } from "../../store/useDataStore";
import { useUiStore } from "../../store/useUiStore";
import { StatsCard } from "./components/StatsCard";
import { DownloadHistory, ProjectInfo, CameraInfo } from "./components";
import { DetectionBarChart, DetectionComposedChart, DetectionLineChart, OperationalRadar, ResourceMonitor } from '../../components/graficos';
import { BasePanelModal } from "../../components/shared";
import { Shield, Camera, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { colunasLogs, radarData, lineLogs, composedLogs } from '../../mocks/logsPageMocks/test'
import { mockDownloads, cameras, teamMembers } from "../../mocks/indexPageMocks/test";
// 🚀 Correção do caminho do import do serviço (retirado erro de digitação do seu código original)
import { reportPerformanceService } from "../../services/reportPerfomance"; 

function HomePage() {
  const currentTheme = useUiStore((s) => s.theme);

  const { reportData, fetchReport, lastUpdated, isLoading, reportFiles, fetchReportFiles } = useDataStore();
  const [timeSinceUpdate, setTimeSinceUpdate] = useState("Atualizando...");
  const [performanceData, setPerformanceData] = useState([]);

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await reportPerformanceService.listMetrics();
      const rawData = response?.data || response || [];

      // 🚀 MODELAGEM DOS DADOS SIMPLIFICADA:
      const formattedData = rawData.map((item) => {
        let formattedTime = "00:00";
        if (item.timestamp) {
          const dateObj = new Date(item.timestamp);
          formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }

        return {
          time: formattedTime,
          memoria: item.quantity_of_cpu_ind_percentage ?? 0, // Vai para a linha de memória
          paginas: item.process_loaded ?? 0                  // Pega direto da coluna de páginas
        };
      });

      // Pega os últimos 10 registros em ordem cronológica
      setPerformanceData(formattedData.reverse().slice(-10));
    } catch (err) {
      console.error("Erro ao buscar métricas de performance:", err);
    }
  };

  // Polling Automático dos relatórios do sistema (A cada 30 segundos)
  useEffect(() => {
    fetchReport();
    fetchReportFiles();
    fetchPerformanceMetrics(); // 🚀 Dispara no carregamento inicial da página

    const interval = setInterval(() => {
      fetchReport();
      fetchReportFiles();
      fetchPerformanceMetrics(); // 🚀 Atualiza os gráficos em tempo real junto com o polling
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchReport, fetchReportFiles]);

  // Atualização do contador visual de tempo
  useEffect(() => {
    if (!lastUpdated) return;

    const updateTimer = () => {
      const now = new Date();
      const diffInSeconds = Math.floor((now - lastUpdated) / 1000);

      if (diffInSeconds < 60) {
        setTimeSinceUpdate(`Atualizado há ${diffInSeconds}s atrás`);
      } else {
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        setTimeSinceUpdate(`Atualizado há ${diffInMinutes}m atrás`);
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 5000);

    return () => clearInterval(timerInterval);
  }, [lastUpdated]);

  const totalDeteccoes = reportData?.counts?.total ?? "---";
  const precisao = reportData?.accuracy ? `${(reportData.accuracy.acertos / (reportData.accuracy.acertos + reportData.accuracy.erros) * 100).toFixed(1)}%` : "---";
  const piorEpi = reportData?.prediction ? `${reportData.prediction}` : "Analisando...";
  const alertasPendentes = reportData?.accuracy?.erros ?? "---";
  
  const nomeArquivo = reportFiles?.length > 0 ? reportFiles[0].nome : "Nenhum arquivo encontrado";
  const tipoArquivo = reportFiles?.length > 0 ? reportFiles[0].tipo : "N/A";
  const dataGeracao = reportFiles?.length > 0 ? new Date(reportFiles[0].dataGeracao).toLocaleString() : "N/A";
  const tamanhoArquivo = reportFiles?.length > 0 ? `${(reportFiles[0].tamanho / (1024 * 1024)).toFixed(2)} MB` : "N/A";

  // 🚀 ASSINATURA DAS LINHAS DA HOMEPAGE:
  // Definimos de forma declarativa o comportamento do nosso gráfico reutilizável para esta tela
  const homeMetricsConfig = [
    { key: 'memoria', name: 'Uso Heap JS', stroke: '#10b981', yAxisId: 'left', unit: '%' },
    { key: 'paginas', name: 'Páginas Carregadas', stroke: '#3b82f6', yAxisId: 'right', unit: ' pág' }
  ];

  // Configuração dos itens do Carrossel
  const chartsForCarousel = [
    { label: "Detecções por Categoria", component: <DetectionBarChart data={colunasLogs} theme={currentTheme}/> },
    { label: "Eficiencia Operacional", component: <OperationalRadar data={radarData} theme={currentTheme}/> },
    
    // 🚀 APLICAÇÃO DINÂMICA: Passamos as configurações específicas via props
    { 
      label: "Monitoramento de Recursos do Front", 
      component: (
        <ResourceMonitor 
          data={performanceData} 
          theme={currentTheme}
          linesConfig={homeMetricsConfig}
          yAxisLeftDomain={[0, 'auto']} // Escala limpa para percentual
          showRightAxis={true}          // Ativa o eixo Y secundário para contagem de páginas
        />
      ) 
    },
    
    { label: "Analise de eventos simultaneos", component: <DetectionComposedChart data={composedLogs} theme={currentTheme}/> },
    { label: "Alertas Mensais", component: <DetectionLineChart data={lineLogs} theme={currentTheme} /> }
  ];

  return (
    <div className={`panel-theme-${currentTheme} min-h-screen w-full transition-colors duration-300 bg-projeto-main`}>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Cabeçalho Dinâmico */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-mono uppercase tracking-wider text-theme-title ">
              Visão geral do sistema de detecção de EPI's
            </h2>
            <p className="text-xs font-mono text-theme-title flex items-center gap-2 mt-1">
              {isLoading && <RefreshCw size={12} className="animate-spin text-emerald-500" />}
              {timeSinceUpdate}
            </p>
          </div>
          <button 
            onClick={() => { fetchReport(); fetchPerformanceMetrics(); }}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-200 panel-btn-toggle border border-theme-divider disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Forçar Atualização
          </button>
        </div>

        {/* SEÇÃO 1: Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard theme={currentTheme} title="Detecções Hoje (Total)" value={totalDeteccoes} icon={Shield} description="Volume de processamento da IA" />
          <StatsCard theme={currentTheme} title="Taxa de Conformidade" value={precisao} icon={TrendingUp} trend={{ value: 3.2, isPositive: true }} />
          <StatsCard theme={currentTheme} title="Crítico: Maior Alerta" value={piorEpi} icon={Camera} description={reportData?.probability ? `Confiança: ${(reportData.probability * 100).toFixed(0)}%` : ""} />
          <StatsCard theme={currentTheme} title="Não Conformidades" value={alertasPendentes} icon={AlertTriangle} trend={{ value: 14, isPositive: false }} />
        </div>

        {/* SEÇÃO 2: Informações do Projeto */}
        <section className="w-full">
           <ProjectInfo theme={currentTheme} data={teamMembers} />
        </section>

        {/* SEÇÃO 3: Carrossel / Gráficos */}
        <section className="w-full h-[500px]">
          <BasePanelModal
            title="Análise de Dados"
            isGraf={true}
            allowFullScreen={true}
            availableCharts={chartsForCarousel}
            className="h-[450px]"
            theme={currentTheme}
          />
        </section>

        {/* SEÇÃO 4: Histórico */}
        <section className="w-full overflow-hidden">
            <DownloadHistory theme={currentTheme} data={reportFiles} />
        </section>

        {/* SEÇÃO 5: Camera Info */}
        <section className="w-full">
            <CameraInfo theme={currentTheme} data={cameras}/>
        </section>
      </main>
    </div>
  );
}

export default HomePage;