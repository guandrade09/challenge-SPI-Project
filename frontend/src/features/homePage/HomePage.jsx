import { useEffect, useState } from "react";
import { useDataStore } from "../../store/useDataStore";
import { useUiStore } from "../../store/useUiStore";
import { useResourceMetrics } from "../../hooks/useResourceMetrics";
import { StatsCard } from "./components/StatsCard";
import { DownloadHistory, ProjectInfo, CameraInfo } from "./components";
import {
  DetectionBarChart,
  DetectionComposedChart,
  DetectionLineChart,
  OperationalRadar,
  ResourceMonitor,
} from "../../components/graficos";
import { BasePanelModal } from "../../components/shared";
import { Shield, Camera, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { colunasLogs, radarData, lineLogs, composedLogs } from "../../mocks/logsPageMocks/test";
import detectionService from "../../services/detectionService";
import cameraService from "../../services/cameraService";
import { teamMembers } from "../../mocks/indexPageMocks/test";

function HomePage() {
  const currentTheme = useUiStore((s) => s.theme);

  const { reportData, fetchReport, lastUpdated, isLoading, reportFiles, fetchReportFiles } = useDataStore();
  const [timeSinceUpdate, setTimeSinceUpdate] = useState("Atualizando...");
  const [detectionsByCategory, setDetectionsByCategory] = useState([]);
  const [detectionsLoaded, setDetectionsLoaded] = useState(false);
  const [monthlyAlertData, setMonthlyAlertData] = useState([]);
  const [monthlyAlertLoaded, setMonthlyAlertLoaded] = useState(false);

  const [dbCameras, setDbCameras] = useState([]);
  const [camerasLoading, setCamerasLoading] = useState(false);

  // 🚀 Hook Reutilizável: Passando null no 1º arg para ver o geral ou o nome exato da thread
  const { data: performanceData, refetch: refetchMetrics } = useResourceMetrics("renderFrontend_pages", 30);

  const fetchCameras = async () => {
    try {
      setCamerasLoading(true);
      const response = await cameraService.getCameras();
      const camerasList = Array.isArray(response) ? response : response?.data || [];
      setDbCameras(camerasList);
    } catch (err) {
      console.error("Erro ao buscar câmeras do banco na HomePage:", err);
      setDbCameras([]);
    } finally {
      setCamerasLoading(false);
    }
  };

  const fetchDetectionsForCurrentMonth = async () => {
    try {
      const payload = await detectionService.list();
      const items = payload?.data || [];

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const filtered = items.filter((it) => {
        if (!it.timestamp) return false;
        const d = new Date(it.timestamp);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const map = {};
      filtered.forEach((it) => {
        const label = it.label || "Desconhecido";
        const conf = typeof it.confidence !== "undefined" ? parseFloat(it.confidence) : 1;
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

      const alertMap = {};
      const today = new Date();
      const todayDay = today.getDate();
      const todayMonth = today.getMonth();
      const todayYear = today.getFullYear();

      filtered
        .filter((it) => {
          const conf = typeof it.confidence !== "undefined" ? parseFloat(it.confidence) : 0;
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
          const hourLabel = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          alertMap[hourLabel] = (alertMap[hourLabel] || 0) + 1;
        });

      const dailyAlerts = Object.keys(alertMap)
        .sort((a, b) => {
          const [hourA, minuteA] = a.split(":").map(Number);
          const [hourB, minuteB] = b.split(":").map(Number);
          return hourA - hourB || minuteA - minuteB;
        })
        .map((hora) => ({ hora, alertas: alertMap[hora] }));

      setDetectionsByCategory(result);
      setMonthlyAlertData(dailyAlerts);
      setDetectionsLoaded(true);
      setMonthlyAlertLoaded(true);
    } catch (err) {
      console.error("Erro ao buscar detecções:", err);
      setDetectionsLoaded(true);
      setMonthlyAlertLoaded(true);
    }
  };

  useEffect(() => {
    fetchReport();
    fetchReportFiles();
    fetchDetectionsForCurrentMonth();
    fetchCameras();
  }, [fetchReport, fetchReportFiles]);

  useEffect(() => {
    const chartInterval = setInterval(() => {
      refetchMetrics();
      fetchDetectionsForCurrentMonth();
      fetchCameras();
    }, 15000);

    return () => clearInterval(chartInterval);
  }, [refetchMetrics]);

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
  const precisao = reportData?.accuracy
    ? `${((reportData.accuracy.acertos / (reportData.accuracy.acertos + reportData.accuracy.erros)) * 100).toFixed(1)}%`
    : "---";
  const piorEpi = reportData?.prediction ? `${reportData.prediction}` : "Analisando...";
  const alertasPendentes = reportData?.accuracy?.erros ?? "---";

  const homeMetricsConfig = [
    {
      key: "cpu",
      name: "Consumo CPU (%)",
      stroke: "var(--chart-line-1)",
      yAxisId: "left",
    },
    {
      key: "paginas",
      name: "Carga de Processos / Páginas",
      stroke: "var(--chart-line-2)",
      yAxisId: "right",
    },
  ];

  const chartsForCarousel = [
    {
      label: "Detecções por Categoria",
      component: (
        <DetectionBarChart
          data={detectionsLoaded ? detectionsByCategory : colunasLogs}
          theme={currentTheme}
        />
      ),
    },
    {
      label: "Eficiência Operacional",
      component: <OperationalRadar data={radarData} theme={currentTheme} />,
    },
    {
      label: "Monitoramento de Threads e Recursos",
      component: (
        <ResourceMonitor
          data={performanceData}
          theme={currentTheme}
          linesConfig={homeMetricsConfig}
          yAxisLeftDomain={[0, 100]}
          showRightAxis={true}
        />
      ),
    },
    {
      label: "Análise de Eventos Simultâneos",
      component: <DetectionComposedChart data={composedLogs} theme={currentTheme} />,
    },
    {
      label: "Alertas Mensais",
      component: (
        <DetectionLineChart
          data={monthlyAlertLoaded ? monthlyAlertData : lineLogs}
          theme={currentTheme}
        />
      ),
    },
  ];

  return (
    <div className={`panel-theme-${currentTheme} min-h-screen w-full transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl text-[var(--p-text)] uppercase tracking-wider">
              Visão geral do sistema de detecção de EPI's
            </h2>
            <p className="text-xs text-[var(--p-text)] flex items-center gap-2 mt-1">
              {isLoading && <RefreshCw size={12} className="animate-spin text-emerald-500" />}
              {timeSinceUpdate}
            </p>
          </div>
          <button
            onClick={() => {
              fetchReport();
              refetchMetrics();
              fetchDetectionsForCurrentMonth();
              fetchCameras();
            }}
            disabled={isLoading || camerasLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-200 panel-btn-toggle border border-theme-divider disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={isLoading || camerasLoading ? "animate-spin" : ""} />
            Forçar Atualização
          </button>
        </div>

        {/* SEÇÃO 1: Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            theme={currentTheme}
            title="Detecções Hoje (Total)"
            value={totalDeteccoes}
            icon={Shield}
            description="Volume de processamento da IA"
          />
          <StatsCard
            theme={currentTheme}
            title="Taxa de Conformidade"
            value={precisao}
            icon={TrendingUp}
            trend={{ value: 3.2, isPositive: true }}
          />
          <StatsCard
            theme={currentTheme}
            title="Crítico: Maior Alerta"
            value={piorEpi}
            icon={Camera}
            description={
              reportData?.probability ? `Confiança: ${(reportData.probability * 100).toFixed(0)}%` : ""
            }
          />
          <StatsCard
            theme={currentTheme}
            title="Não Conformidades"
            value={alertasPendentes}
            icon={AlertTriangle}
            trend={{ value: 14, isPositive: false }}
          />
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

        {/* SEÇÃO 5: Câmeras registradas */}
        <section className="w-full">
          <CameraInfo theme={currentTheme} data={dbCameras} />
        </section>
      </main>
    </div>
  );
}

export default HomePage;