import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Shield, Activity, MapPin, Camera, Clock } from 'lucide-react';
import { formatLabel, formatIncidentLabel, formatTs } from '../../../utils/formatLabel';
import { streamService } from '../../../services/streamService';
import { ConfidenceBadge, SourceBadge } from '../../../components/ui/Badge';
import { IconButtonModal } from '../../../components/shared/IconButtonModal';
import { useUiStore } from '../../../store/useUiStore';
import IncidentCanvas from './IncidentCanvas';

export function IncidentModal({ incident, onClose }) {
  const currentTheme = useUiStore((s) => s.theme);

  if (!incident) return null;

  const imgUrl = streamService.imagePathToUrl(incident.img_path);
  const lateralUrl = streamService.imagePathToUrl(incident.img_path_lateral);
  const d = incident.details;

  // Checagem de dados para os blocos
  const hasSeguranca = (d?.epi?.length > 0) || (d?.zona?.length > 0);
  const hasErgonomia = d?.ergonomia?.length > 0;

  return createPortal(
    <div className={`panel-theme-${currentTheme} font-theme-body`}>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" 
        onClick={onClose}
      >
        {/* Overlay de Fundo adaptável ao tema */}
        <div 
          className="absolute inset-0 backdrop-blur-sm transition-opacity" 
          style={{ backgroundColor: 'var(--p-overlay)' }}
        />
        
        {/* Container Principal do Modal */}
        <div
          className="relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 border-theme-divider"
          style={{ 
            backgroundColor: 'var(--p-bg)', 
            borderColor: 'var(--p-border)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER DO MODAL */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-b border-theme-divider shrink-0"
            style={{ backgroundColor: 'var(--p-header-bg)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 shrink-0 shadow-sm">
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-base sm:text-lg leading-tight text-theme-title">
                    {formatIncidentLabel(incident.label)}
                  </h2>
                  <SourceBadge source={incident.source} />
                </div>
                <p className="text-theme-muted text-xs font-mono mt-0.5 flex items-center gap-1.5">
                  <Clock size={12} className="shrink-0 opacity-70" />
                  {formatTs(incident.timestamp)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ConfidenceBadge value={incident.confidence} />
              <IconButtonModal
                unstyled
                onClick={onClose}
                className="icon-btn-ghost cursor-pointer"
                icon={X}
                title="Fechar"
              />
            </div>
          </div>

          {/* CORPO DO MODAL (LAYOUT 2 COLUNAS) */}
          <div 
            className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto custom-scrollbar flex-1"
            style={{ backgroundColor: 'var(--p-graf-bg)' }}
          >
            
            {/* COLUNA ESQUERDA: CÂMERAS (7 COLS) */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              
              {/* Câmera Frontal */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-theme-main font-bold flex items-center gap-1.5">
                    <Camera size={13} className="text-amber-500" /> Câmera Frontal
                  </span>
                  {incident.camera_id && (
                    <span className="text-[10px] font-mono text-theme-muted badge-theme-industrial px-2 py-0.5 rounded font-medium">
                      CAM: {incident.camera_id}
                    </span>
                  )}
                </div>
                <IncidentCanvas imgUrl={imgUrl} details={d} source="frontal" />
              </div>

              {/* Câmera Lateral */}
              {incident.img_path_lateral && (
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-theme-main font-bold flex items-center gap-1.5">
                    <Camera size={13} className="text-amber-500" /> Câmera Lateral
                  </span>
                  <IncidentCanvas imgUrl={lateralUrl} details={d} source="lateral" />
                </div>
              )}
            </div>

            {/* COLUNA DIREITA: CARDS DE MÉTRICAS (5 COLS) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* CARD MONTADO 1: SEGURANÇA & EPIS */}
              {hasSeguranca && (
                <div className="panel-subcard shadow-lg flex flex-col gap-4">
                  
                  {/* SUB-BLOCO: EPIs */}
                  {d?.epi?.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-theme-divider">
                        <span className="text-xs font-mono uppercase tracking-wider text-blue-500 font-bold flex items-center gap-1.5">
                          <Shield size={14} /> EPIs Detectados
                        </span>
                        <span className="text-[10px] font-mono text-theme-muted">{d.epi.length} itens</span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {d.epi.map((epi, i) => {
                          const ausente = epi.label?.toLowerCase().includes('ausente');
                          const camTag = epi.camera || epi.source;
                          return (
                            <div 
                              key={i} 
                              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono ${
                                ausente 
                                  ? 'bg-red-500/10 border-red-500/40 text-red-500' 
                                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              <span className="font-semibold flex items-center gap-1.5">
                                {ausente ? '✖' : '✓'} {formatLabel(epi.label)}
                                {camTag && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded badge-theme-industrial font-normal">
                                    {camTag}
                                  </span>
                                )}
                              </span>
                              <ConfidenceBadge value={epi.confidence} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SUB-BLOCO: ZONA DE RISCO */}
                  {d?.zona?.length > 0 && (
                    <div className="flex flex-col gap-2.5 pt-1">
                      <div className="flex items-center justify-between pb-2 border-b border-theme-divider">
                        <span className="text-xs font-mono uppercase tracking-wider text-amber-500 font-bold flex items-center gap-1.5">
                          <MapPin size={14} /> Perímetro / Zona de Alerta
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {d.zona.map((z, i) => (
                          <div 
                            key={i} 
                            className="flex flex-col gap-1 p-2.5 rounded-lg text-xs font-mono border border-theme-divider"
                            style={{ backgroundColor: 'var(--p-bg)' }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-theme-main font-semibold flex items-center gap-1.5">
                                Pessoa #{z.pessoa_id ?? i + 1}
                                {(z.camera || z.source) && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded badge-theme-industrial font-normal">
                                    {z.camera || z.source}
                                  </span>
                                )}
                              </span>
                              <span className={`px-2 py-0.5 rounded border font-bold text-[10px] ${
                                z.invadiu 
                                  ? 'bg-red-500/15 border-red-500/40 text-red-500' 
                                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {z.invadiu ? '⚠ Invasão' : '✓ Normal'}
                              </span>
                            </div>
                            {z.epis_ausentes?.length > 0 && (
                              <div className="text-red-500 text-[11px] bg-red-500/10 p-1.5 rounded border border-red-500/30 mt-0.5">
                                Falta: <span className="font-bold">{z.epis_ausentes.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* CARD MONTADO 2: ERGONOMIA & REBA */}
              {hasErgonomia && (
                <div className="panel-subcard shadow-lg flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-theme-divider">
                    <span className="text-xs font-mono uppercase tracking-wider text-purple-500 dark:text-purple-400 font-bold flex items-center gap-1.5">
                      <Activity size={14} /> Análise Ergonômica (REBA)
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {d.ergonomia.map((p, i) => {
                      const score = p.reba_score ?? 0;
                      const rebaBadgeStyle = score >= 7 
                        ? 'text-red-500 bg-red-500/15 border-red-500/40' 
                        : score >= 4 
                        ? 'text-amber-500 bg-amber-500/15 border-amber-500/40' 
                        : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/40';

                      return (
                        <div 
                          key={i} 
                          className="flex flex-col gap-1.5 p-2.5 rounded-lg text-xs font-mono border border-theme-divider"
                          style={{ backgroundColor: 'var(--p-bg)' }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-theme-main font-semibold flex items-center gap-1.5">
                              Pessoa #{p.pessoa_id ?? i + 1}
                              {(p.camera || p.source) && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded badge-theme-industrial font-normal">
                                  {p.camera || p.source}
                                </span>
                              )}
                            </span>
                            <span className={`px-2 py-0.5 rounded border font-bold text-[10px] ${rebaBadgeStyle}`}>
                              REBA {score} • {p.reba_level ?? 'N/A'}
                            </span>
                          </div>
                          
                          {p.queda && (
                            <div className="p-1.5 rounded bg-red-500/15 border border-red-500/40 text-red-500 text-[11px] flex items-center gap-1.5 font-bold mt-0.5">
                              <AlertTriangle size={12} className="shrink-0 text-red-500" /> Alerta de Queda Detectada
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!d && (
                <div className="panel-subcard p-6 text-theme-muted text-xs font-mono text-center">
                  Registro antigo sem detalhes estruturados.
                </div>
              )}

            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default IncidentModal;