//src/features/incidentesPage/components/IncidentModal.jsx

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Camera, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatLabel, formatIncidentLabel, formatTs } from '../../../utils/formatLabel';
import { streamService } from '../../../services/streamService';
import { ConfidenceBadge, SourceBadge } from '../../../components/ui/Badge';
import { IconButtonModal } from '../../../components/shared/IconButtonModal';
import { useUiStore } from '../../../store/useUiStore';
import IncidentCanvas from './IncidentCanvas';
import { OverlayVisibilityControls } from './OverlayVisibilityControls';
import { IncidentCameraDetails } from './IncidentCameraDetails';
import { getIncidentCameraDetails, getUnassignedCameraDetails } from '../utils/frameOverlayData';

export function IncidentModal({ incident, onClose, onPrev, onNext, index = 0, total = 1 }) {
  const currentTheme = useUiStore((s) => s.theme);
  const [showEpi, setShowEpi] = useState(true);
  const [showReba, setShowReba] = useState(true);
  const bodyRef = useRef(null);

  if (!incident) return null;

  const imgUrl = streamService.imagePathToUrl(incident.img_path);
  const lateralUrl = streamService.imagePathToUrl(incident.img_path_lateral);
  const d = incident.details;

  const hasLateralFrame = !!incident.img_path_lateral;
  const primarySource = d?.image_source || d?.frames?.frontal?.source || 'frontal';
  const views = [{ source: primarySource, imgUrl, primary: true }];
  if (hasLateralFrame) views.push({ source: d?.frames?.lateral?.source || 'lateral', imgUrl: lateralUrl, primary: false });
  const unassigned = getUnassignedCameraDetails(d, { hasLateralFrame });
  const navigate = (callback) => {
    callback?.();
    bodyRef.current?.scrollTo({ top: 0 });
  };

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

          {total > 1 && index >= 0 && (
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-theme-divider shrink-0 bg-[var(--p-header-bg)]">
              <button type="button" onClick={() => navigate(onPrev)} disabled={index === 0 || !onPrev} aria-label="Incidente anterior" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-theme-divider text-xs text-theme-main hover:bg-theme-hover disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={16} /> Anterior
              </button>
              <span aria-live="polite" className="text-xs font-mono text-theme-muted whitespace-nowrap">{index + 1} de {total}</span>
              <button type="button" onClick={() => navigate(onNext)} disabled={index >= total - 1 || !onNext} aria-label="Próximo incidente" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-theme-divider text-xs text-theme-main hover:bg-theme-hover disabled:opacity-30 disabled:cursor-not-allowed">
                Próximo <ChevronRight size={16} />
              </button>
            </div>
          )}

          <div
            ref={bodyRef}
            className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1"
            style={{ backgroundColor: 'var(--p-graf-bg)' }}
          >
            {views.map(({ source, imgUrl: frameUrl, primary }) => {
              const cameraDetails = getIncidentCameraDetails(d, source, { hasLateralFrame });
              const cameraId = cameraDetails.cameraId ?? (!hasLateralFrame ? incident.camera_id : null);
              return (
                <section key={source} className="flex flex-col gap-3" aria-label={`Câmera ${source}`}>
                  <div className="flex items-center justify-between gap-2 px-1">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-theme-main font-bold flex items-center gap-1.5">
                      <Camera size={13} className="text-amber-500" /> Câmera {source === 'lateral' ? 'Lateral' : 'Frontal'}
                    </h3>
                    {cameraId != null && <span className="text-[10px] font-mono text-theme-muted badge-theme-industrial px-2 py-0.5 rounded">CAM: {cameraId}</span>}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7 flex flex-col gap-2">
                      <OverlayVisibilityControls details={d} source={source} hasLateralFrame={hasLateralFrame} showEpi={showEpi} showReba={showReba} onToggleEpi={() => setShowEpi((visible) => !visible)} onToggleReba={() => setShowReba((visible) => !visible)} />
                      <IncidentCanvas imgUrl={frameUrl} details={d} source={source} hasLateralFrame={hasLateralFrame} showEpi={showEpi} showReba={showReba} />
                    </div>
                    <div className="lg:col-span-5">
                      <IncidentCameraDetails cameraDetails={cameraDetails} source={source} />
                    </div>
                  </div>
                  {primary && !d && <p className="text-theme-muted text-xs">Registro antigo sem detalhes estruturados.</p>}
                </section>
              );
            })}
            {(unassigned.epi.length > 0 || unassigned.zona.length > 0) && (
              <section className="panel-subcard border border-amber-500/30 flex flex-col gap-3">
                <p className="text-theme-main text-xs">Este registro antigo contém detecções sem identificação da câmera. Elas são listadas abaixo e não recebem marcações sobre as imagens.</p>
                <div className="flex flex-wrap gap-2">
                  {unassigned.epi.map((item, index) => <span key={`epi-${index}`} className="text-xs text-theme-muted border border-theme-divider rounded px-2 py-1">{formatLabel(item.label)} <ConfidenceBadge value={item.confidence} /></span>)}
                  {unassigned.zona.map((item, index) => <span key={`zona-${index}`} className="text-xs text-theme-muted">{item.nome || 'Zona de risco'}: {item.invadiu ? 'invasão' : 'normal'}</span>)}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default IncidentModal;
