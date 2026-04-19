// src/features/logsPage/components/LogPanel.jsx
import React from 'react';

export const LogPanel = ({ title, logs = [] }) => {
  return (
    // h-full para ocupar o espaço do pai, min-h-0 para permitir scroll interno
    <div className="w-full max-w-md bg-[#D9D9D9] rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-full min-h-0">
      <div className="bg-[#B59481] py-6 text-center shrink-0">
        <h2 className="text-4xl font-normal tracking-widest text-white">{title || "LOG PANEL"}</h2>
      </div>

      {/* flex-1 faz esta div ocupar o resto do espaço; min-h-0 ativa o overflow-y-auto adequadamente */}
      <div className="flex-1 p-6 overflow-y-auto min-h-0 space-y-4">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-[#B59481]">
                <p className="text-zinc-800 font-mono text-sm">{log.timestamp} - {log.message}</p>
            </div>
          ))
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-white h-24 w-full rounded-lg animate-pulse" />
            <div className="bg-white h-24 w-full rounded-lg opacity-50" />
          </div>
        )}
      </div>
    </div>
  );
};

export default LogPanel;