import React, { useState, useMemo, useEffect } from 'react';
import { ShieldAlert, Check, X, ChevronLeft, ChevronRight, Eye, Cpu, MessageSquare } from 'lucide-react';
import imgNotFound from '../../../assets/Codexis/img-not-found.jpg';
import PopupModal from '../../../components/shared/PopupModal';
import IconButtonModal from '../../../components/shared/IconButtonModal';

export function CriticalActionCard({ events = [], selectedEventId, onValidate }) {
  // 1. Filtrar eventos críticos pendentes
  const pendingCriticalEvents = useMemo(() => {
    return events.filter(
      (evt) =>
        (evt.gravidade === 'alta' || evt.gravidade === 'critico') &&
        evt.status === 'Pendente'
    );
  }, [events]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados locais do feedback de IA
  const [mlFeedback, setMlFeedback] = useState(null); // 'correct' | 'incorrect'
  const [errorReason, setErrorReason] = useState('');
  const [customComment, setCustomComment] = useState('');

  // Sincronização via selectedEventId
  useEffect(() => {
    if (!selectedEventId || pendingCriticalEvents.length === 0) return;

    const selectedIndexInCritical = pendingCriticalEvents.findIndex(
      (evt) => String(evt.id) === String(selectedEventId)
    );

    if (selectedIndexInCritical !== -1) {
      setCurrentIndex(selectedIndexInCritical);
      resetFeedbackState();
    }
  }, [selectedEventId, pendingCriticalEvents]);

  // Trava para limites do array e auto-close se zerar os pendentes com o modal aberto
  useEffect(() => {
    if (pendingCriticalEvents.length === 0) {
      setCurrentIndex(0);
      setIsModalOpen(false);
      resetFeedbackState();
    } else if (currentIndex >= pendingCriticalEvents.length) {
      setCurrentIndex(pendingCriticalEvents.length - 1);
    }
  }, [pendingCriticalEvents.length, currentIndex]);

  const currentEvent = pendingCriticalEvents[currentIndex] || null;

  const resetFeedbackState = () => {
    setMlFeedback(null);
    setErrorReason('');
    setCustomComment('');
  };

  const handleNext = () => {
    if (currentIndex < pendingCriticalEvents.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      resetFeedbackState();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      resetFeedbackState();
    }
  };

  // Abre o modal pré-selecionando o feedback e opcionalmente o motivo do erro
  const handleOpenModalWithFeedback = (initialFeedback = null, defaultReason = '') => {
    resetFeedbackState();
    if (initialFeedback) {
      setMlFeedback(initialFeedback);
      if (defaultReason) {
        setErrorReason(defaultReason);
      }
    }
    setIsModalOpen(true);
  };

  const handleFinalSubmit = (status) => {
    if (!currentEvent) return;

    const validationPayload = {
      eventId: currentEvent.id,
      status: status,
      mlFeedback: {
        isCorrect: mlFeedback === 'correct',
        errorReason: mlFeedback === 'incorrect' ? errorReason : null,
        userComment: customComment || null,
        validatedAt: new Date().toISOString(),
        detectedClass: currentEvent.tipo,
      }
    };

    if (onValidate) {
      onValidate(currentEvent.id, status, validationPayload);
    }
    
    // Reset dos campos de feedback mantendo o modal aberto para a próxima ocorrência
    resetFeedbackState();
  };

  return (
    <>
      <div className="flex flex-col p-4 rounded-2xl border border-[var(--risk-alert-border)] bg-[var(--risk-alert-bg)] relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white text-[9px] font-mono font-bold uppercase tracking-wider rounded-bl-lg shadow-sm">
          Ação Imediata
        </div>

        <div className="flex items-center justify-between mb-3 pr-20">
          <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 flex items-center gap-2 font-theme-title">
            <ShieldAlert size={18} className="animate-pulse" />
            Validar Críticos
          </h3>

          {pendingCriticalEvents.length > 0 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              {pendingCriticalEvents.length} pendente(s)
            </span>
          )}
        </div>

        {currentEvent ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-[var(--p-header-bg)] p-2 rounded-lg border border-theme-divider">
              <div className="text-xs text-theme-muted font-mono truncate">
                ID: <span className="text-theme-main font-bold">{currentEvent.id}</span> | {currentEvent.timestamp}
              </div>

              {pendingCriticalEvents.length > 0 && (
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-1 rounded bg-[var(--p-bg)] hover:bg-theme-hover disabled:opacity-30 disabled:cursor-not-allowed text-theme-main transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] font-mono text-theme-muted px-1">
                    {currentIndex + 1}/{pendingCriticalEvents.length}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === pendingCriticalEvents.length - 1}
                    className="p-1 rounded bg-[var(--p-bg)] hover:bg-theme-hover disabled:opacity-30 disabled:cursor-not-allowed text-theme-main transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider text-xs flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-red-500 font-bold uppercase">{currentEvent.tipo}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 uppercase">
                  {currentEvent.origem}
                </span>
              </div>
              <span className="text-theme-muted">
                {currentEvent.setor} — {currentEvent.camera}
              </span>
            </div>

            {/* CONTAINER DA IMAGEM DO CARD */}
            <div 
              onClick={() => handleOpenModalWithFeedback(null)}
              className="w-full h-44 rounded-lg overflow-hidden border border-theme-divider bg-black/40 relative group cursor-pointer flex items-center justify-center"
            >
              <img
                src={currentEvent.imagem || imgNotFound}
                alt={`Ocorrência Crítica ${currentEvent.id}`}
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
              Valide o alerta antes de enviar para o banco de dados do modelo:
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
            <p className="text-xs font-semibold text-theme-main">Tudo limpo por aqui!</p>
            <p className="text-[11px] text-theme-muted max-w-[200px]">
              Nenhum evento crítico pendente de validação no momento.
            </p>
          </div>
        )}
      </div>

      {/* POPUP MODAL COM CARROSSEL E AUDITORIA */}
      {currentEvent && (
        <PopupModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Auditoria da IA — Evento #${currentEvent.id}`}
          icon={Cpu}
          maxWidth="max-w-2xl"
        >
          <div className="flex flex-col gap-4">
            
            {/* ÁREA DA IMAGEM COM CONTROLES DO CARROSSEL */}
            <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-theme-divider bg-black/40 relative group flex items-center justify-center">
              <img
                src={currentEvent.imagem || imgNotFound}
                alt={`Ocorrência ${currentEvent.id}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = imgNotFound;
                }}
              />

              {/* Botão Anterior */}
              {pendingCriticalEvents.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/10 backdrop-blur-sm"
                  title="Anterior"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              {/* Botão Próximo */}
              {pendingCriticalEvents.length > 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentIndex === pendingCriticalEvents.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/10 backdrop-blur-sm"
                  title="Próximo"
                >
                  <ChevronRight size={20} />
                </button>
              )}

              {/* Indicador de Quantidade/Posição */}
              {pendingCriticalEvents.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/90">
                  {currentIndex + 1} de {pendingCriticalEvents.length}
                </div>
              )}
            </div>

            {/* INFORMAÇÕES DO EVENTO ATUAL */}
            <div className="p-3 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider text-xs grid grid-cols-2 gap-2 font-mono">
              <div><strong className="text-theme-main">Detecção:</strong> {currentEvent.tipo}</div>
              <div><strong className="text-theme-main">Local:</strong> {currentEvent.setor}</div>
              <div><strong className="text-theme-main">Câmera:</strong> {currentEvent.camera}</div>
              <div><strong className="text-theme-main">Horário:</strong> {currentEvent.timestamp}</div>
            </div>

            {/* CAMPOS DE AUDITORIA DE IA */}
            <div className="p-3.5 rounded-xl border border-theme-divider bg-theme-hover/20 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-main">
                <Cpu size={16} className="text-blue-500" />
                <span>Avaliação de Acurácia do Modelo</span>
              </div>

              <p className="text-xs text-theme-muted">
                A IA rotulou este evento como <strong className="text-red-400">{currentEvent.tipo}</strong>. Esta detecção está correta?
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMlFeedback('correct');
                    setErrorReason('');
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    mlFeedback === 'correct'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm'
                      : 'border-theme-divider bg-[var(--p-bg)] text-theme-muted hover:border-theme-hover'
                  }`}
                >
                  <Check size={16} />
                  IA Acertou (Procedente)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMlFeedback('incorrect');
                    setErrorReason('ghost_detection');
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    mlFeedback === 'incorrect'
                      ? 'border-red-500 bg-red-500/10 text-red-400 shadow-sm'
                      : 'border-theme-divider bg-[var(--p-bg)] text-theme-muted hover:border-theme-hover'
                  }`}
                >
                  <X size={16} />
                  IA Errou (Falso Positivo)
                </button>
              </div>

              {mlFeedback === 'incorrect' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-theme-divider animate-fadeIn">
                  <label className="text-[11px] font-semibold text-theme-main">
                    Qual foi o tipo de erro cometido pela IA?
                  </label>
                  <select
                    value={errorReason}
                    onChange={(e) => setErrorReason(e.target.value)}
                    className="p-2 rounded-lg bg-[var(--p-bg)] border border-theme-divider text-xs text-theme-main focus:outline-none focus:border-red-500"
                  >
                    <option value="">Selecione o motivo do erro...</option>
                    <option value="ghost_detection">Detecção fantasma selecionada</option>
                    <option value="false_positive_item_present">Equipamento/EPI estava presente (Falso Positivo)</option>
                    <option value="misclassified_object">Objeto confundido com outro item</option>
                    <option value="bad_lighting_occlusion">Iluminação ruim ou objeto oculto</option>
                    <option value="other">Outro motivo</option>
                  </select>
                </div>
              )}

              {mlFeedback && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-theme-muted flex items-center gap-1">
                    <MessageSquare size={12} />
                    Observações para o Dataset (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Capacete reflexivo confundido com cabeça..."
                    value={customComment}
                    onChange={(e) => setCustomComment(e.target.value)}
                    className="p-2 rounded-lg bg-[var(--p-bg)] border border-theme-divider text-xs text-theme-main focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* RODAPÉ DO MODAL COM AÇÕES */}
            <div className="flex items-center justify-end pt-2 border-t border-theme-divider">
              <div className="flex gap-2">
                <IconButtonModal
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="full"
                  icon={X}
                  label="Fechar"
                  colorVariant="cancel"
                />

                <IconButtonModal
                  type="button"
                  variant="full"
                  icon={Check}
                  label="Salvar Validação"
                  colorVariant="success"
                  disabled={!mlFeedback || (mlFeedback === 'incorrect' && !errorReason)}
                  onClick={() => handleFinalSubmit(mlFeedback === 'correct' ? 'Validado' : 'Descartado')}
                />
              </div>
            </div>
          </div>
        </PopupModal>
      )}
    </>
  );
}

export default CriticalActionCard;