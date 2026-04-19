// src/features/logsPage/LogsPage.jsx
import React from 'react';
import { LogPanel, DashboardChart, DetectionBarChart, DetectionLineChart, MessageConsole } from './components';

const dummyLogs = [
  { timestamp: '14:21:05', message: 'Câmera 01 conectada' },
  { timestamp: '14:22:10', message: 'Alerta: Detecção de capacete ausente,' },
  { timestamp: '14:23:15', message: 'Alerta: Detecção de vestimenta de segurança ausente,' },
  { timestamp: '14:24:20', message: 'Pronto: Detecção de oculos de proteção' },

  // ... seus outros logs
];

const LogsPage = () => {
  return (
    // Mudamos para h-screen e overflow-hidden para travar a tela
    <div className="w-full h-screen flex flex-col p-4 md:p-8 bg-gradient-to-tr from-neutral-500 to-neutral-950 overflow-hidden">
      
      {/* O main agora tem h-full e usamos min-h-0 para permitir que os filhos calculem o scroll interno */}
      <main className="w-full max-w-[1700px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch h-full min-h-0">
        
        {/* COLUNA 1: Logs */}
        <div className="w-full flex flex-col min-h-0">
          <LogPanel title="Painel de Logs" logs={dummyLogs} />
        </div>

        {/* COLUNA 2 (CENTRO) */}
        <div className="w-full flex flex-col gap-8 min-h-0">
          {/* h-[45%] para o gráfico superior */}
          <div className="h-[45%] shrink-0">
            <DetectionLineChart title="HISTÓRICO DE ALERTAS" />
          </div>
          {/* flex-1 para o console ocupar o resto sem estourar */}
          <div className="flex-1 min-h-0">
             <MessageConsole title="Gerador de Resumo IA" message="..." />
          </div>
        </div>

        {/* COLUNA 3: Gráficos */}
        <div className="w-full flex flex-col gap-8 min-h-0">
          <div className="h-[45%] shrink-0">
            <DashboardChart title="ESTATÍSTICAS GERAIS" />
          </div>
          <div className="flex-1 min-h-0">
            <DetectionBarChart title="DETECÇÕES POR CATEGORIA" />
          </div>
        </div>

      </main>
    </div>
  );
};

export default LogsPage;