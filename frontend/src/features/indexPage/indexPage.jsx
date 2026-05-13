import { StatsCard } from "./components/StatsCard";
import { DownloadHistory, ProjectInfo, CameraInfo } from "./components";
import { DetectionBarChart } from '../logsPage/components/graficos/DetectionBarChart'
import { Shield, Camera, TrendingUp, AlertTriangle } from "lucide-react";
import { colunasLogs } from '../../mocks/logsPageMocks/test'

import { mockDownloads, cameras, teamMembers  } from "../../mocks/indexPageMocks/test";

function IndexPage() {
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

      {/* SEÇÃO 3: Gráfico (Linha única, agora visível) */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Análise de Detecções por Categoria GRAFICO DE COLUNA</h3>
          {/* <DetectionBarChart data={colunasLogs} /> */}
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

export default IndexPage;