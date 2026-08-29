import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { streamService } from '../../../services/streamService';
import { formatIncidentLabel, formatTs } from '../../../utils/formatLabel';
import { ConfidenceBadge, SourceBadge } from '../../../components/ui/Badge';

export function IncidentCard({ incident, onClick }) {
  const imgUrl = streamService.imagePathToUrl(incident.img_path);
  const hasDetails = !!incident.details;
  const hasZonaAlert = incident.details?.zona?.some((z) => z.invadiu);
  const hasQueda = incident.details?.ergonomia?.some((p) => p.queda);
  const hasEpiAusente = incident.details?.epi?.some((e) => e.label?.toLowerCase().includes('ausente'));

  const borderColor = hasZonaAlert || hasQueda ? 'border-red-500/40' : hasEpiAusente ? 'border-yellow-500/40' : 'border-white/5';

  return (
    <button
      onClick={() => onClick(incident)}
      className={`group text-left w-full bg-[#1c1d26] border ${borderColor} rounded-xl overflow-hidden hover:border-blue-500/40 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5`}
    >
      <div className="relative w-full h-36 bg-neutral-900 overflow-hidden">
        {imgUrl ? (
          <img src={imgUrl} alt="frame" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">Sem imagem</div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {(hasZonaAlert || hasQueda) && <AlertTriangle size={14} className="text-red-400" />}
          {hasDetails && <div className="w-2 h-2 rounded-full bg-emerald-400 mt-0.5" title="Tem detalhes" />}
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        <p className="text-white text-xs font-medium leading-tight line-clamp-2">{formatIncidentLabel(incident.label)}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <ConfidenceBadge value={incident.confidence} />
          <SourceBadge source={incident.source} />
        </div>
        <p className="text-neutral-500 text-[10px] font-mono">{formatTs(incident.timestamp)}</p>
      </div>
    </button>
  );
}

export default IncidentCard;