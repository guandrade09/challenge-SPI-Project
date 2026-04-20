// src/features/logsPage/components/LogPanel.jsx
import React from 'react';
// Importe diretamente do arquivo do componente para evitar importação circular no index.js
import { LogReportButton } from './LogReportButton'; 
import { LogSkeleton } from './LogSkeleton';

// src/features/logsPage/components/LogPanel.jsx
export const LogPanel = ({ logs = [] }) => {
  return (
    // O contêiner pai precisa ser relative e ter h-full
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden"> 
      
      {/* 1. Lista de Logs com Padding extra no final (pb-20) para o botão não cobrir a última msg */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2 pb-20 custom-scrollbar">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-panel-header">
                <p className="text-zinc-800 font-mono text-[11px] leading-tight">
                  <span className="opacity-50">{log.timestamp}</span> - {log.message}
                </p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <LogSkeleton />
            <span className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest animate-bounce">
                Aguardando Logs...
             </span>
          </div>
        )}
      </div>

      {/* 2. Botão Flutuante / Sobreposição Fixa */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-panel-bg via-panel-bg/90 to-transparent pt-10">
        <LogReportButton />
      </div>

    </div>
  );
};

export default LogPanel;