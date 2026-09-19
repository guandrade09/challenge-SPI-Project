// src/features/incidentesPage/components/IncidentCard.jsx

import React, { useState } from 'react';
import { streamService } from '../../../services/streamService';
import { formatIncidentLabel, formatTs } from '../../../utils/formatLabel';
import { ConfidenceBadge, SourceBadge } from '../../../components/ui/Badge';
import { getIncidentIcons } from './utils/Utils';

export function IncidentCard({ incident, onClick }) {
  const [imgError, setImgError] = useState(false);
  const imgUrl = streamService.imagePathToUrl(incident.img_path);
  
  // Obtém ícones de alerta com mensagens formatadas
  const activeAlertIcons = getIncidentIcons(incident);

  const hasCritical = activeAlertIcons.some((item) => item.color.includes('red'));
  const hasWarning = activeAlertIcons.some((item) => item.color.includes('amber') || item.color.includes('yellow'));

  const borderColor = hasCritical 
    ? 'border-red-500/60' 
    : hasWarning 
    ? 'border-amber-500/60' 
    : 'border-[var(--p-border)]';

  const isFullyConforming = activeAlertIcons.length === 0;

  return (
    <button
      onClick={() => onClick(incident)}
      className={`group text-left w-full panel-subcard border ${borderColor} rounded-xl transition-all duration-200 hover:border-blue-500/60 hover:shadow-lg relative`}
    >
      {/* Container da Imagem */}
      <div className="relative w-full h-36 bg-[var(--p-graf-bg)] rounded-t-xl overflow-hidden">
        {imgUrl && !imgError ? (
          <img 
            src={imgUrl} 
            alt="frame" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-theme-muted text-xs">Sem imagem</div>
        )}
      </div>

      {/* Badges e Ícones Flutuantes no Canto Superior Direito */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-[var(--p-overlay)] p-1 px-1.5 rounded-md backdrop-blur-sm border border-white/10 z-30">
        {/* Renderização dos ícones ativos */}
        {activeAlertIcons.map(({ key, icon: Icon, color, title, animate }) => (
          <div key={key} className="relative flex items-center justify-center group/tooltip">
            <Icon 
              size={14} 
              className={`${color} ${animate ? 'animate-pulse' : ''}`} 
            />
            {/* Tooltip exibido ao passar o mouse */}
            <span className="absolute top-full mt-1.5 right-0 hidden group-hover/tooltip:flex whitespace-nowrap bg-neutral-900/95 text-white text-[10px] px-2 py-1 rounded shadow-xl pointer-events-none z-50 border border-white/20 font-sans">
              {title}
            </span>
          </div>
        ))}

        {/* Círculo Verde exibido apenas quando totalmente conforme */}
        {isFullyConforming && (
          <div className="relative flex items-center justify-center group/tooltip">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="absolute top-full mt-1.5 right-0 hidden group-hover/tooltip:flex whitespace-nowrap bg-neutral-900/95 text-white text-[10px] px-2 py-1 rounded shadow-xl pointer-events-none z-50 border border-white/20 font-sans">
              Conforme / Sem pendências
            </span>
          </div>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <p className="text-theme-main text-xs font-semibold leading-tight line-clamp-2">{formatIncidentLabel(incident.label)}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <ConfidenceBadge value={incident.confidence} />
          <SourceBadge source={incident.source} />
        </div>
        <p className="text-theme-title text-[10px] font-mono">{formatTs(incident.timestamp)}</p>
      </div>
    </button>
  );
}

export default IncidentCard;