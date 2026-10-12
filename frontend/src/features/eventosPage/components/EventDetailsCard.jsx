import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, HardHat, MapPin, Calendar, FileText, ImageOff, Trash2 } from 'lucide-react';
import { formatEventLongDate, getEventDetectionSummary } from '../../../utils/eventDetails';
import { useUiStore } from '../../../store/useUiStore';

function getPreviewPosition(rect) {
  const width = Math.min(256, window.innerWidth - 32);
  const top = rect.bottom + 8 + 192 <= window.innerHeight ? rect.bottom + 8 : Math.max(16, rect.top - 200);
  return { top, left: Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16)), width };
}

function FramePreview({ event }) {
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [position, setPosition] = useState({});
  const buttonRef = useRef(null);
  const theme = useUiStore((state) => state.theme);
  const previewId = `event-frame-preview-${event.origem}-${event.id}`;

  const show = () => {
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition(getPreviewPosition(rect));
    setVisible(true);
  };

  useEffect(() => {
    if (!visible) return;
    const dismiss = () => setVisible(false);
    const outside = (event) => { if (!buttonRef.current?.contains(event.target)) dismiss(); };
    const escape = (event) => { if (event.key === 'Escape') dismiss(); };
    const reposition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom <= 0 || rect.top >= window.innerHeight) dismiss();
      else setPosition(getPreviewPosition(rect));
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [visible]);

  return (
    <>
      <button
        ref={buttonRef} type="button" aria-label="Prévia do frame" aria-describedby={visible ? previewId : undefined}
        onMouseEnter={show} onMouseLeave={() => setVisible(false)} onFocus={show} onBlur={() => setVisible(false)} onClick={show}
        className="h-10 w-10 shrink-0 rounded-lg border border-theme-divider bg-[var(--p-header-bg)] text-sm font-bold text-theme-main hover:bg-theme-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p-accent)]"
      >?</button>
      {visible && createPortal(
        <div className={`panel-theme-${theme} fixed z-[10000] pointer-events-none font-theme-body`} style={position}>
          <figure id={previewId} role="tooltip" data-testid="event-frame-preview" className="rounded-lg border border-theme-divider bg-[var(--p-bg)] p-2 shadow-xl">
            {event.imagem && !failed ? (
              <img src={event.imagem} alt={`Prévia da ocorrência ${event.id}`} className="h-36 w-full object-contain rounded bg-black/20" onError={() => setFailed(true)} />
            ) : (
              <div className="h-36 flex flex-col items-center justify-center gap-2 text-xs text-theme-muted text-center">
                <ImageOff size={22} />
                <p>{failed ? 'Não foi possível carregar o frame.' : 'Frame não disponível.'}</p>
              </div>
            )}
            <figcaption className="mt-2 truncate text-[11px] text-theme-muted">Frame da ocorrência · #{event.id}</figcaption>
          </figure>
        </div>, document.body,
      )}
    </>
  );
}

export function EventDetailsCard({ event, onValidate, onDelete }) {
  const isLog = event?.origem === 'Log';
  return (
    <div data-testid="event-details-card" style={{ height: 'auto' }} className="flex-none shrink-0 flex flex-col panel-base p-4 shadow-md">
      <h3 className="text-sm font-bold uppercase tracking-wider text-theme-accent border-b border-theme-divider pb-3 mb-4 flex items-center gap-2 font-theme-title">
        <Eye size={18} /> Detalhes da Ocorrência
      </h3>
      {event ? (
        <div className="flex min-w-0 flex-col gap-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider">
            <span className="min-w-0 break-all text-theme-muted font-mono">ID: {event.id}</span>
            <span className={`font-bold ${event.gravidade === 'alta' || event.gravidade === 'critico' ? 'text-red-500' : event.urgency === 'epi' ? 'text-blue-500' : 'text-amber-500'}`}>
              GRAVIDADE {event.gravidade.toUpperCase()}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              {isLog ? <FileText className="w-4 h-4 text-theme-muted shrink-0 mt-0.5" /> : <HardHat className="w-4 h-4 text-theme-muted shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className="text-theme-head">{isLog ? 'Log Identificado' : 'Detecção Registrada'}</p>
                <p className="font-semibold text-sm text-theme-main break-words">{getEventDetectionSummary(event)}</p>
                {!isLog && <p className="mt-1 text-[11px] text-theme-muted break-words">{event.tipo}</p>}
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-theme-muted shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-theme-head">Local / Câmera</p>
                <p className="font-semibold text-theme-main break-words">{event.setor} | {event.nome || event.camera}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-theme-muted shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-theme-head">Data e Hora</p>
                <p className="text-theme-main break-words">{formatEventLongDate(event.rawDate)}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-theme-divider pt-3">
            <button type="button" onClick={() => onValidate?.(event)} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-theme-divider bg-[var(--p-header-bg)] px-3 font-semibold text-theme-main hover:bg-theme-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p-accent)]">
              <Eye size={15} /> Detalhes
            </button>
            <button type="button" onClick={() => onDelete?.(event)} disabled={event.deleteId == null} title={event.deleteId == null ? 'Não foi possível identificar este registro para exclusão.' : undefined} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 font-semibold text-red-500 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500">
              <Trash2 size={15} /> Excluir
            </button>
            <FramePreview key={`${event.origem}:${event.id}:${event.imagem}`} event={event} />
          </div>
        </div>
      ) : (
        <p className="text-xs text-theme-muted">Selecione um evento na lista ao lado.</p>
      )}
    </div>
  );
}

export default EventDetailsCard;
