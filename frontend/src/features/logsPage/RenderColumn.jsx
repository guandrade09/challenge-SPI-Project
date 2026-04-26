// src/features/logsPage/RenderColumn.jsx
import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { BasePanel } from '../../components/shared/BasePanelModal';
import { LogSettingsButton } from './components/painelLog'; // Certifique-se de que o caminho está correto

export const RenderColumn = ({ config, componentMap }) => {
  // Verifica se esta coluna possui apenas um painel (caso dos logs na col1)
  const isSinglePanel = config.length === 1;

  return (
    <div className="w-full flex flex-col gap-8 h-full min-h-0">
      {config.map((panelGroup, idx) => {
        const charts = panelGroup.map(id => {
          const item = componentMap[id];
          if (!item) return { id, label: "Erro", component: <div>Erro</div> };
          return { id, ...item };
        });

        // Identifica se é o painel de logs
        const isLogPanel = panelGroup.includes('logs');

        return (
          <div 
            key={idx} 
            className={
              isSinglePanel 
                ? "flex-1 min-h-0" 
                : (idx === 0 ? "h-[45%] shrink-0 min-h-0" : "flex-1 min-h-0")
            }
          >
            <BasePanel 
              title={charts.length === 1 ? charts[0].label : ""} 
              isGraf={!isLogPanel} 
              allowFullScreen={!isLogPanel} 
              // Se for Log, insere o botão de configurações (engrenagem)
              headerAction={isLogPanel ? <LogSettingsButton /> : null}
              availableCharts={charts} 
            />
          </div>
        );
      })}
    </div>
  );
};

export default RenderColumn;