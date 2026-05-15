import { StatsCard } from "./components/StatsCard";
import { DownloadHistory, ProjectInfo, CameraInfo } from "./components";
import { DetectionBarChart, DetectionComposedChart, DetectionLineChart, OperationalRadar } from '../../components/graficos';
import { BasePanelModal } from "../../components/shared";
import { Shield, Camera, TrendingUp, AlertTriangle } from "lucide-react";
import { colunasLogs, radarData, lineLogs, composedLogs } from '../../mocks/logsPageMocks/test'

import { mockDownloads, cameras, teamMembers  } from "../../mocks/indexPageMocks/test";

function HomePage() {

  const chartsForCarousel = [
    { 
      label: "Detecções por Categoria", 
      component: <DetectionBarChart data={colunasLogs} /> 
    },
    { 
      label: "Eficiencia Operacional", 
      // Exemplo de outro gráfico se você tiver, ou use o mesmo para teste
      component: <OperationalRadar data={radarData} /> 
    },
    {
      label: "Analise de eventos simultaneos",
      component: <DetectionComposedChart data={composedLogs}/>
    },
    {
      label: "Alertas Mensais",
      component: <DetectionLineChart data={lineLogs} />
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold text-white-900">Visão geral do sistema de detecção de EPI's</h2>
      </div>

      {/* SEÇÃO 1: Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Detecções Hoje" value="1,284" icon={Shield} trend={{ value: 12.5, isPositive: true }} />
          <StatsCard title="Conformidade" value="92.8%" icon={TrendingUp} trend={{ value: 3.2, isPositive: true }} />
          <StatsCard title="Câmeras Ativas" value="3/4" icon={Camera} />
          <StatsCard title="Alertas Pendentes" value="8" icon={AlertTriangle} trend={{ value: 25, isPositive: false }} />
        </div>
      </div>

      {/* SEÇÃO 2: Informações do Projeto (Linha única) */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
         <ProjectInfo data={teamMembers} />
      </section>

      <section className="w-full h-[500px]">
        <BasePanelModal
          title="Análise de Dados" // Título fallback
          isGraf={true}
          allowFullScreen={true}
          availableCharts={chartsForCarousel}
          className="h-[450px]" // Define a altura do painel
        >
          {/* 
            O 'children' aqui só será usado se 'availableCharts' estiver vazio.
            Como passamos o array, o BasePanelModal gerenciará a troca.
          */}
        </BasePanelModal>
      </section>

      {/* SEÇÃO 4: Histórico (Tabela Scrollável) */}
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