// src/features/logsPage/components/LogPanel.jsx
import React from 'react';
import { BasePanel } from '../../../components/shared/BasePanel';
import { AiToggleButton } from '../../../components/shared/chatAi/AiToggleButton';
import { LogSettingsButton } from './LogSettingsButton';

export const LogPanel = ({ title, logs = [] }) => {
  
  // Função para o botão de engrenagem do topo
  const handleSettingsClick = () => {
    console.log("Configurações de Log clicadas");
    // Aqui você poderia abrir um modal de filtros, por exemplo.
  };

  return (
    <BasePanel 
      title={title || "PAINEL DE LOG"}
      headerAction={<LogSettingsButton onClick={handleSettingsClick} />}
    >
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 mb-4 pr-2 custom-scrollbar">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-panel-header">
                <p className="text-zinc-800 font-mono text-[11px] leading-tight">
                  <span className="opacity-50">{log.timestamp}</span> - {log.message}
                </p>
            </div>
          ))
        ) : (
          <div className="flex flex-col gap-4 italic text-zinc-400 text-center py-10">
            Aguardando novos logs...
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-zinc-200/50">
        {/* O Botão de IA agora está corretamente importado e funcional */}
        <AiToggleButton />
      </div>
    </BasePanel>
  );
};

export default LogPanel;