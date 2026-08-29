import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Shield, Activity, MapPin } from 'lucide-react';
import { formatLabel, formatIncidentLabel, formatTs } from '../../../utils/formatLabel';
import { streamService } from '../../../services/streamService';
import { ConfidenceBadge, SourceBadge } from '../../../components/ui/Badge';
import IncidentCanvas from './IncidentCanvas';

export function IncidentModal({ incident, onClose }) {
  if (!incident) return null;
  
  const imgUrl = streamService.imagePathToUrl(incident.img_path);
  const lateralUrl = streamService.imagePathToUrl(incident.img_path_lateral);
  const d = incident.details;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-[#16171d] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-white font-semibold text-lg">{formatIncidentLabel(incident.label)}</h2>
            <p className="text-neutral-400 text-xs mt-0.5">{formatTs(incident.timestamp)}</p>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceBadge value={incident.confidence} />
            <SourceBadge source={incident.source} />
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Visualizadores de Câmera */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">Câmera Frontal</p>
            <IncidentCanvas imgUrl={imgUrl} details={d} source="frontal" />
            {lateralUrl && (
              <>
                <p className="text-xs font-mono uppercase tracking-wider text-neutral-500 mt-4">Câmera Lateral</p>
                <IncidentCanvas imgUrl={lateralUrl} details={d} source="lateral" />
              </>
            )}
          </div>

          {/* Painel de Métricas / Detalhes */}
          <div className="space-y-4">
            {d?.epi?.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} className="text-blue-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-blue-400">EPI Detectados</span>
                </div>
                <div className="space-y-2">
                  {d.epi.map((epi, i) => {
                    const ausente = epi.label?.toLowerCase().includes('ausente');
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className={ausente ? 'text-red-400' : 'text-emerald-400'}>
                          {formatLabel(epi.label)}
                        </span>
                        <ConfidenceBadge value={epi.confidence} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {d?.ergonomia?.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={14} className="text-purple-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-purple-400">Ergonomia / REBA</span>
                </div>
                <div className="space-y-2">
                  {d.ergonomia.map((p, i) => {
                    const rebaColor = (p.reba_score ?? 0) >= 7 ? 'text-red-400' : (p.reba_score ?? 0) >= 4 ? 'text-yellow-400' : 'text-emerald-400';
                    return (
                      <div key={i} className="text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-300">Pessoa {p.pessoa_id ?? i}</span>
                          <span className={`font-mono font-bold ${rebaColor}`}>
                            REBA {p.reba_score ?? '—'} — {p.reba_level ?? '?'}
                          </span>
                        </div>
                        {p.queda && (
                          <div className="text-red-400 text-xs flex items-center gap-1">
                            <AlertTriangle size={10} /> Queda detectada
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {d?.zona?.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} className="text-orange-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-orange-400">Zona de Risco</span>
                </div>
                <div className="space-y-2">
                  {d.zona.map((z, i) => (
                    <div key={i} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">Pessoa {z.pessoa_id ?? i}</span>
                        <span className={z.invadiu ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
                          {z.invadiu ? '⚠ Invadiu zona' : '✓ Fora da zona'}
                        </span>
                      </div>
                      {z.epis_ausentes?.length > 0 && (
                        <p className="text-red-400 text-xs mt-1">EPIs ausentes: {z.epis_ausentes.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!d && (
              <div className="bg-white/5 rounded-xl p-4 text-neutral-500 text-sm text-center">
                Registro antigo — sem detalhes estruturados
              </div>
            )}

            {incident.camera_id && (
              <div className="text-xs text-neutral-500 font-mono">
                Câmera: <span className="text-neutral-300">{incident.camera_id}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default IncidentModal;