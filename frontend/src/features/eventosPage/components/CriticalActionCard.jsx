import React, { useState, useMemo } from 'react';
import { ShieldAlert, Check, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import imgNotFound from '../../../assets/Codexis/img-not-found.jpg';
import { EventValidationModal } from './EventValidationModal';
import IconButtonModal from '../../../components/shared/IconButtonModal';
import { getPendingValidationEvents, getValidationUrgency } from '../../../utils/eventValidation';

const PRIORITY_STYLES = {
  critica: {
    panel: 'border-[var(--risk-alert-border)] bg-[var(--risk-alert-bg)]',
    text: 'text-red-500', badge: 'bg-red-500/20 text-red-400 border-red-500/30', ribbon: 'bg-red-600', label: 'Ação Imediata',
  },
  alerta: {
    panel: 'border-amber-500/40 bg-amber-500/10',
    text: 'text-amber-500', badge: 'bg-amber-500/20 text-amber-500 border-amber-500/30', ribbon: 'bg-amber-600', label: 'Alerta',
  },
  epi: {
    panel: 'border-blue-500/40 bg-blue-500/10',
    text: 'text-blue-500', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', ribbon: 'bg-blue-600', label: 'Alerta de EPI',
  },
  empty: {
    panel: 'border-theme-divider bg-[var(--p-header-bg)]',
    text: 'text-theme-main', badge: '', ribbon: 'bg-emerald-600', label: 'Sem Pendências',
  },
};

export function CriticalActionCard({ events = [], selectedEventId, onValidate }) {
  const pendingEvents = useMemo(() => getPendingValidationEvents(events), [events]);
  const [navigation, setNavigation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalDefaults, setModalDefaults] = useState({ feedback: null, reason: '' });

  const targetId = navigation && navigation.selectedId === selectedEventId ? navigation.eventId : selectedEventId;
  const targetIndex = pendingEvents.findIndex((event) => event.id === targetId);
  const currentIndex = Math.max(0, targetIndex);
  const currentEvent = pendingEvents[currentIndex] || null;
  const priority = currentEvent ? getValidationUrgency(currentEvent) : 'empty';
  const style = PRIORITY_STYLES[priority];

  const handleNext = () => {
    if (currentIndex < pendingEvents.length - 1) {
      setNavigation({ selectedId: selectedEventId, eventId: pendingEvents[currentIndex + 1].id });
      setModalDefaults({ feedback: null, reason: '' });    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setNavigation({ selectedId: selectedEventId, eventId: pendingEvents[currentIndex - 1].id });
      setModalDefaults({ feedback: null, reason: '' });    }
  };

  const handleOpenModalWithFeedback = (initialFeedback = null, defaultReason = '') => {
    setModalDefaults({ feedback: initialFeedback, reason: defaultReason });
    setIsModalOpen(true);
  };

  return (
    <>
      <div className={`flex flex-col p-4 rounded-2xl border ${style.panel} relative overflow-hidden shadow-md transition-colors`}>
        <div className={`absolute top-0 right-0 px-3 py-1 ${style.ribbon} text-white text-[9px] font-mono font-bold uppercase tracking-wider rounded-bl-lg shadow-sm`}>
          {style.label}
        </div>

        <div className="flex items-center justify-between mb-3 pr-20">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${style.text} flex items-center gap-2 font-theme-title`}>
            <ShieldAlert size={18} className={priority === 'critica' ? 'animate-pulse' : ''} />
            Validar Detecções
          </h3>

          {pendingEvents.length > 0 && (
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
              {pendingEvents.length} pendente(s)
            </span>
          )}
        </div>

        {currentEvent ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-[var(--p-header-bg)] p-2 rounded-lg border border-theme-divider">
              <div className="text-xs text-theme-muted font-mono truncate">
                ID: <span className="text-theme-main font-bold">{currentEvent.id}</span> | {currentEvent.timestamp}
              </div>

              {pendingEvents.length > 0 && (
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-1 rounded bg-[var(--p-bg)] hover:bg-theme-hover disabled:opacity-30 disabled:cursor-not-allowed text-theme-main transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] font-mono text-theme-muted px-1">
                    {currentIndex + 1}/{pendingEvents.length}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === pendingEvents.length - 1}
                    className="p-1 rounded bg-[var(--p-bg)] hover:bg-theme-hover disabled:opacity-30 disabled:cursor-not-allowed text-theme-main transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider text-xs flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className={`${style.text} font-bold uppercase`}>{currentEvent.tipo}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${style.badge} uppercase`}>
                  {currentEvent.origem}
                </span>
              </div>
              <span className="text-theme-muted">
                {currentEvent.setor} — {currentEvent.camera}
              </span>
              <span className={`font-mono font-semibold ${style.text}`}>
                Confiança: {currentEvent.confidence === null || currentEvent.confidence === undefined ? 'Não informada' : `${(currentEvent.confidence * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
              </span>
            </div>

            {/* CONTAINER DA IMAGEM DO CARD */}
            <div
              onClick={() => handleOpenModalWithFeedback(null)}
              className="w-full h-44 rounded-lg overflow-hidden border border-theme-divider bg-black/40 relative group cursor-pointer flex items-center justify-center"
            >
              <img
                src={currentEvent.imagem || imgNotFound}
                alt={`Detecção para validação ${currentEvent.id}`}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = imgNotFound;
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-mono text-xs">
                <Eye size={18} />
                <span>Avaliar Detecção do ML</span>
              </div>
            </div>

            <p className="text-[11px] text-theme-muted">
              {priority === 'critica' ? 'Queda ou invasão em zona de risco: valide esta ocorrência com prioridade.' : 'Detecção abaixo de 80% de confiança: confira o frame e valide a ocorrência.'}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <IconButtonModal
                icon={Check}
                label="Procedente"
                colorVariant="success"
                onClick={() => handleOpenModalWithFeedback('correct')}
              />
              <IconButtonModal
                icon={X}
                label="Falso Alarme"
                colorVariant="cancel"
                onClick={() => handleOpenModalWithFeedback('incorrect', 'ghost_detection')}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
              <Check size={24} />
            </div>
            <p className="text-xs font-semibold text-[var(--p-text-title)]">Tudo limpo por aqui!</p>
            <p className="text-[11px] text-[var(--p-text-title)] max-w-[200px]">
              Nenhuma detecção aguardando validação no momento.
            </p>
          </div>
        )}
      </div>

      {/* POPUP MODAL COM CARROSSEL E AUDITORIA */}
      {currentEvent && isModalOpen && (
        <EventValidationModal
          key={currentEvent.id}
          event={currentEvent}
          onClose={() => setIsModalOpen(false)}
          onValidate={(id, status, payload) => {
            onValidate?.(id, status, payload);
            setIsModalOpen(false);
          }}
          initialFeedback={modalDefaults.feedback}
          initialReason={modalDefaults.reason}
          onPrev={handlePrev}
          onNext={handleNext}
          index={currentIndex}
          total={pendingEvents.length}
        />
      )}
    </>
  );
}

export default CriticalActionCard;
