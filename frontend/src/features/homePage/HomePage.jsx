import { useEffect, useState } from "react";
import { useDataStore } from "../../store/useDataStore";
import { useUiStore } from "../../store/useUiStore";
import { StatsCard } from "./components/StatsCard";
import { DownloadHistory, ProjectInfo, CameraInfo } from "./components";
import { DetectionBarChart, DetectionComposedChart, DetectionLineChart, OperationalRadar, ResourceMonitor } from '../../components/graficos';
import { BasePanelModal } from "../../components/shared";
import { Shield, Camera, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { colunasLogs, radarData, lineLogs, composedLogs } from '../../mocks/logsPageMocks/test'
import detectionService from "../../services/detectionService";
import { mockDownloads, cameras, teamMembers } from "../../mocks/indexPageMocks/test";
// 🚀 Correção do caminho do import do serviço (retirado erro de digitação do seu código original)
import { reportPerformanceService } from "../../services/reportPerfomance"; 

function HomePage() {
  const currentTheme = useUiStore((s) => s.theme);

  const { reportData, fetchReport, lastUpdated, isLoading, reportFiles, fetchReportFiles } = useDataStore();
  const [timeSinceUpdate, setTimeSinceUpdate] = useState("Atualizando...");
  const [performanceData, setPerformanceData] = useState([]);
  const [detectionsByCategory, setDetectionsByCategory] = useState([]);
  const [detectionsLoaded, setDetectionsLoaded] = useState(false);
  const [monthlyAlertData, setMonthlyAlertData] = useState([]);
  const [monthlyAlertLoaded, setMonthlyAlertLoaded] = useState(false);

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await reportPerformanceService.listMetrics();
      
      // 🚀 CORREÇÃO: Como seu backend agora retorna { count, data }, buscamos a chave 'data'
      // Adicionamos fallbacks caso a estrutura varie
      const rawData = response?.data?.data || response?.data || response || [];

      if (!Array.isArray(rawData)) {
        console.warn("Formato de dados recebido não é um array válido:", response);
        return;
      }

      // 🚀 TRATAMENTO E LIMPEZA VISUAL DOS DADOS:
      const formattedData = rawData.map((item) => {
        let formattedTime = "00:00";
        
        if (item.timestamp) {
          const dateObj = new Date(item.timestamp);
          // Formata para o padrão brasileiro de horas e minutos (HH:MM)
          formattedTime = dateObj.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        }

        return {
          time: formattedTime,
          // Garante que o valor seja numérico e limita a 2 casas decimais para o tooltip não ficar gigante
          memoria: item.quantity_of_cpu_ind_percentage ? parseFloat(item.quantity_of_cpu_ind_percentage.toFixed(2)) : 0,
          paginas: item.process_loaded ?? 0
        };
      });

      // 🚀 OTIMIZAÇÃO DE EXIBIÇÃO:
      // O banco SQLite retorna do mais antigo para o mais recente. 
      // Pegamos apenas os últimos 35 registros para o gráfico ficar limpo e legível na tela.
      const limitedData = formattedData.slice(-35);

      setPerformanceData(limitedData);
    } catch (err) {
      console.error("Erro ao buscar métricas de performance na API:", err);
    }
  };

  const fetchDetectionsForCurrentMonth = async () => {
    try {
      const payload = await detectionService.list();
      const items = payload?.data || [];

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Filtra pelas detecções do mês atual
      const filtered = items.filter((it) => {
        if (!it.timestamp) return false;
        const d = new Date(it.timestamp);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      // Agrupa por label e conta ocorrências, classificando por confiança
      const map = {};
      filtered.forEach((it) => {
        const label = it.label || 'Desconhecido';
        const conf = typeof it.confidence !== 'undefined' ? parseFloat(it.confidence) : 1;
        if (!map[label]) map[label] = { detectado: 0, naoDetectado: 0 };

        if (!isNaN(conf) && conf < 0.6) {
          map[label].naoDetectado += 1;
        } else {
          map[label].detectado += 1;
        }
      });

      const result = Object.keys(map).map((label) => ({
        name: label,
        detectado: map[label].detectado,
        naoDetectado: map[label].naoDetectado,
      }));

      // Agrupa os alertas do dia atual com confiança acima de 0.8 por hora
      const alertMap = {};
      const today = new Date();
      const todayDay = today.getDate();
      const todayMonth = today.getMonth();
      const todayYear = today.getFullYear();

      filtered
        .filter((it) => {
          const conf = typeof it.confidence !== 'undefined' ? parseFloat(it.confidence) : 0;
          if (isNaN(conf) || conf <= 0.8) return false;
          const date = new Date(it.timestamp);
          return (
            date.getDate() === todayDay &&
            date.getMonth() === todayMonth &&
            date.getFullYear() === todayYear
          );
        })
        .forEach((it) => {
          const date = new Date(it.timestamp);
          const hourLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          alertMap[hourLabel] = (alertMap[hourLabel] || 0) + 1;
        });

      const dailyAlerts = Object.keys(alertMap)
        .sort((a, b) => {
          const [hourA, minuteA] = a.split(':').map(Number);
          const [hourB, minuteB] = b.split(':').map(Number);
          return hourA - hourB || minuteA - minuteB;
        })
        .map((hora) => ({ hora, alertas: alertMap[hora] }));

      setDetectionsByCategory(result);
      setMonthlyAlertData(dailyAlerts);
      setDetectionsLoaded(true);
      setMonthlyAlertLoaded(true);
    } catch (err) {
      console.error('Erro ao buscar detecções:', err);
      setDetectionsLoaded(true);
      setMonthlyAlertLoaded(true);
    }
  };

  // Fetch inicial de dados gerais e dos gráficos
  useEffect(() => {
    fetchReport();
    fetchReportFiles();
    fetchPerformanceMetrics();
    fetchDetectionsForCurrentMonth();
  }, [fetchReport, fetchReportFiles]);

  // Atualização automática apenas dos dados de gráfico a cada 15 segundos
  useEffect(() => {
    const chartInterval = setInterval(() => {
      fetchPerformanceMetrics();
      fetchDetectionsForCurrentMonth();
    }, 15000);

    return () => clearInterval(chartInterval);
  }, []);

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
    { label: "Detecções por Categoria", component: <DetectionBarChart data={detectionsLoaded ? detectionsByCategory : colunasLogs} theme={currentTheme}/> },
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
    { label: "Alertas Mensais", component: <DetectionLineChart data={monthlyAlertLoaded ? monthlyAlertData : lineLogs} theme={currentTheme} /> }
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
            onClick={() => { fetchReport(); fetchPerformanceMetrics(); fetchDetectionsForCurrentMonth(); }}
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