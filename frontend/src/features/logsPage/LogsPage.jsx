// src/features/logsPage/LogsPage.jsx
import React from 'react';
import { LogPanel, DashboardChart, DetectionBarChart, DetectionLineChart, MessageConsole } from './components';

const dummyLogs = [
  { timestamp: '14:21:05', message: 'Câmera 01 conectada' },
  // ... seus outros logs
];

const LogsPage = () => {
  return (
    <div className="w-full flex-1 flex items-center justify-center p-4 md:p-8 bg-gradient-to-tr from-neutral-500 to-neutral-950 min-h-screen">
      {/* Grid de 3 colunas para acomodar o layout profissional */}
      <main className="w-full max-w-[1700px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* COLUNA 1: Logs */}
        <div className="w-full flex justify-center lg:justify-start">
          <LogPanel logs={dummyLogs} />
        </div>

        {/* COLUNA 2 (CENTRO): Tendência + Console de Mensagens */}
        <div className="w-full flex flex-col gap-8 items-center">
          <DetectionLineChart title="HISTÓRICO DE ALERTAS" />
          
          {/* O novo componente entra aqui embaixo do gráfico de linha */}
          <MessageConsole 
            title="SISTEMA" 
            message="Monitoramento ativo. Todos os sensores de EPI estão operando dentro da normalidade." 
          />
        </div>

        {/* COLUNA 3: Estatísticas e Categorias */}
        <div className="w-full flex flex-col gap-8 items-center lg:items-end">
          <DashboardChart title="ESTATÍSTICAS GERAIS" />
          <DetectionBarChart title="DETECÇÕES POR CATEGORIA" />
        </div>

      </main>
    </div>
  );
};

export default LogsPage;