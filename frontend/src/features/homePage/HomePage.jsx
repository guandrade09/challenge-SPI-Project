import { useEffect, useState } from "react";
import { useDataStore } from "../../store/useDataStore"; // Importe o novo store
import { StatsCard } from "./components/StatsCard";
import { DownloadHistory, ProjectInfo, CameraInfo } from "./components";
import { DetectionBarChart, DetectionComposedChart, DetectionLineChart, OperationalRadar } from '../../components/graficos';
import { BasePanelModal } from "../../components/shared";
import { Shield, Camera, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { colunasLogs, radarData, lineLogs, composedLogs } from '../../mocks/logsPageMocks/test'
import { mockDownloads, cameras, teamMembers } from "../../mocks/indexPageMocks/test";

function HomePage() {
  // Conectando com o Zustand Data Store
  const { reportData, fetchReport, lastUpdated, isLoading } = useDataStore();
  const [timeSinceUpdate, setTimeSinceUpdate] = useState("Atualizando...");

  // 1. Efeito para Polling Automático (Atualiza a cada 30 segundos)
  useEffect(() => {
    fetchReport(); // Busca inicial ao montar a tela

    const interval = setInterval(() => {
      fetchReport();
    }, 30000); // 30000ms = 30 segundos

    return () => clearInterval(interval);
  }, [fetchReport]);

  // 2. Efeito para atualizar o contador visual de tempo ("Atualizado há X segundos atrás")
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

    updateTimer(); // Executa imediatamente
    const timerInterval = setInterval(updateTimer, 5000); // Atualiza o texto a cada 5s

    return () => clearInterval(timerInterval);
  }, [lastUpdated]);

  // Extração segura dos dados calculados pelo seu service
  const totalDeteccoes = reportData?.counts?.total ?? "---";
  const precisao = reportData?.accuracy ? `${(reportData.accuracy.acertos / (reportData.accuracy.acertos + reportData.accuracy.erros) * 100).toFixed(1)}%` : "---";
  const piorEpi = reportData?.prediction ? `${reportData.prediction}` : "Analisando...";
  const alertasPendentes = reportData?.accuracy?.erros ?? "---";

  const chartsForCarousel = [
    { label: "Detecções por Categoria", component: <DetectionBarChart data={colunasLogs} /> },
    { label: "Eficiencia Operacional", component: <OperationalRadar data={radarData} /> },
    { label: "Analise de eventos simultaneos", component: <DetectionComposedChart data={composedLogs}/> },
    { label: "Alertas Mensais", component: <DetectionLineChart data={lineLogs} /> }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho Dinâmico */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Visão geral do sistema de detecção de EPI's</h2>
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            {isLoading && <RefreshCw size={14} className="animate-spin text-blue-500" />}
            {timeSinceUpdate}
          </p>
        </div>
        <button 
          onClick={fetchReport}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Forçar Atualização
        </button>
      </div>

      {/* SEÇÃO 1: Stats Cards Populados com Dados Reais do Banco/Service */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Detecções Hoje (Total)" value={totalDeteccoes} icon={Shield} description="Volume de processamento da IA" />
          <StatsCard title="Taxa de Conformidade" value={precisao} icon={TrendingUp} trend={{ value: 3.2, isPositive: true }} />
          <StatsCard title="Crítico: Maior Alerta" value={piorEpi} icon={Camera} description={reportData?.probability ? `Confiança: ${(reportData.probability * 100).toFixed(0)}%` : ""} />
          <StatsCard title="Não Conformidades" value={alertasPendentes} icon={AlertTriangle} trend={{ value: 14, isPositive: false }} />
        </div>
      </div>

      {/* SEÇÃO 2: Informações do Projeto */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
         <ProjectInfo data={teamMembers} />
      </section>

      {/* SEÇÃO 3: Carrossel */}
      <section className="w-full h-[500px]">
        <BasePanelModal
          title="Análise de Dados"
          isGraf={true}
          allowFullScreen={true}
          availableCharts={chartsForCarousel}
          className="h-[450px]"
        />
      </section>

      {/* SEÇÃO 4: Histórico */}
      <section className="w-full overflow-hidden">
          <DownloadHistory data={mockDownloads}/>
      </section>

      {/* SEÇÃO 5: Camera Info */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <CameraInfo data={cameras}/>
      </section>
    </main>
  );
}

export default HomePage;