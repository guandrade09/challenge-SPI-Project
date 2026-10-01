import React, { useState } from 'react';
import { BookOpen, Trash2 } from 'lucide-react';
import { streamService } from '../../../services/streamService';
import { formatIncidentLabel, formatTs } from '../../../utils/formatLabel';
import { ConfidenceBadge, SourceBadge } from '../../../components/ui/Badge';
import { getIncidentIcons } from './utils/Utils';
import { IconButtonModal } from '../../../components/shared/IconButtonModal';
import { useUiStore } from '../../../store/useUiStore';

export function IncidentCard({ incident, onClick, isSelected = false, onToggleSelect, onDelete }) {
  const [imgError, setImgError] = useState(false);
  const imgUrl = streamService.imagePathToUrl(incident.img_path);
  const openPopUpModal = useUiStore((state) => state.openPopUpModal);
  const activeAlertIcons = getIncidentIcons(incident);
  const hasCritical = activeAlertIcons.some((item) => item.color.includes('red'));
  const hasWarning = activeAlertIcons.some((item) => item.color.includes('amber') || item.color.includes('yellow'));
  const borderColor = hasCritical
    ? 'border-red-500/60'
    : hasWarning
      ? 'border-amber-500/60'
      : 'border-[var(--p-border)]';
  const isFullyConforming = activeAlertIcons.length === 0;

  const handleOpenDetails = () => {
    if (onClick) onClick(incident);
    if (openPopUpModal) openPopUpModal(incident);
  };

  return (
    <div className={`group text-left w-full panel-subcard border ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/40' : borderColor} rounded-xl transition-all duration-200 hover:border-blue-500/60 hover:shadow-lg relative flex flex-col justify-between`}>
      <button
        type="button"
        onClick={onToggleSelect}
        aria-pressed={isSelected}
        aria-label={`${isSelected ? 'Desmarcar' : 'Selecionar'} incidente de ${formatTs(incident.timestamp)}`}
        className="block w-full flex-1 text-left cursor-pointer"
      >
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
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-[var(--p-overlay)] p-1 px-1.5 rounded-md backdrop-blur-sm border border-white/10 z-30">
          {activeAlertIcons.map(({ key, icon, color, title, animate }) => (
            <div key={key} className="relative flex items-center justify-center group/tooltip">
              {React.createElement(icon, {
                size: 14,
                className: `${color} ${animate ? 'animate-pulse' : ''}`,
              })}
              <span className="absolute top-full mt-1.5 right-0 hidden group-hover/tooltip:flex whitespace-nowrap bg-neutral-900/95 text-white text-[10px] px-2 py-1 rounded shadow-xl pointer-events-none z-50 border border-white/20 font-sans">
                {title}
              </span>
            </div>
          ))}
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

      <label className="absolute top-2 left-2 z-40 flex items-center rounded bg-[var(--p-overlay)] p-1.5 text-white cursor-pointer" title="Selecionar incidente">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          aria-label={`Selecionar incidente de ${formatTs(incident.timestamp)}`}
        />
      </label>

      {/* Contêiner de botões com flex-1 nos filhos para responsividade ideal em mobile */}
      <div className="p-3 pt-0 flex justify-center items-center gap-2 w-full">
        <IconButtonModal
          icon={BookOpen}
          label="Detalhes"
          title="Abrir detalhes do relatório"
          onClick={handleOpenDetails}
          className="flex-1 w-full"
        />
        <IconButtonModal
          icon={Trash2}
          label="Deletar"
          title="Deletar este incidente"
          colorVariant="danger"
          disabled={!Number.isSafeInteger(incident.id)}
          onClick={() => onDelete(incident)}
          className="flex-1 w-full"
        />
      </div>
    </div>
  );
}

export default IncidentCard;