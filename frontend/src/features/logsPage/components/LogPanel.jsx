// src/features/logsPage/components/LogPanel.jsx
import React from 'react';

export const LogPanel = ({ title, logs = [] }) => {
  return (
    <div className="w-full max-w-md bg-[#D9D9D9] rounded-[40px] overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
      {/* Cabeçalho do Painel */}
      <div className="bg-[#B59481] py-6 text-center">
        <h2 className="text-4xl font-normal tracking-widest text-white">{title || "LOG PANEL"}</h2>
      </div>

      {/* Área de Conteúdo dos Logs */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[675px] space-y-4">
        {logs.length > 0 ? (
            logs.map((log, index) => (
            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-[#B59481]">
                <p className="text-zinc-800 font-mono text-sm">{log.timestamp} - {log.message}</p>
            </div>
            ))
        ) : (
            // Renderiza 3 blocos brancos para simular o layout da imagem original enquanto carrega
            <>
            <div className="bg-white h-24 w-full rounded-lg animate-pulse" />
            <div className="bg-white h-24 w-full rounded-lg opacity-50" />
            <div className="bg-white h-24 w-full rounded-lg opacity-20" />
            </>
        )}
        </div>
    </div>
  );
};

export default LogPanel;