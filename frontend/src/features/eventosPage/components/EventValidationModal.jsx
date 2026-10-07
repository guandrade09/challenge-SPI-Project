import React, { useState } from 'react';
import { Check, X, ChevronLeft, ChevronRight, Cpu, MessageSquare } from 'lucide-react';
import { IncidentCanvas } from '../../incidentesPage/components/IncidentCanvas';
import PopupModal from '../../../components/shared/PopupModal';
import IconButtonModal from '../../../components/shared/IconButtonModal';
import { getValidationAlert } from '../../../utils/eventValidation';
import { OverlayVisibilityControls } from '../../incidentesPage/components/OverlayVisibilityControls';

const ALERT_TEXT_COLORS = { critica: 'text-red-400', alerta: 'text-amber-500', epi: 'text-blue-400' };

export function EventValidationModal({ event, onClose, onValidate, initialFeedback = null, initialReason = '', onPrev, onNext, index = 0, total = 1 }) {
  const [mlFeedback, setMlFeedback] = useState(initialFeedback);
  const [errorReason, setErrorReason] = useState(initialReason);
  const [customComment, setCustomComment] = useState('');
  const [showEpi, setShowEpi] = useState(true);
  const [showReba, setShowReba] = useState(true);
  const [frameSource, setFrameSource] = useState(event.imagemSource || 'frontal');
  const hasTwoFrames = event.imagemLateral && event.imagemSource !== 'lateral';
  const frameUrl = frameSource === 'lateral' && hasTwoFrames ? event.imagemLateral : event.imagem;
  const validationAlert = getValidationAlert(event);

  const handleFinalSubmit = (status) => {
    if (!event) return;

    const validationPayload = {
      eventId: event.id,
      status: status,
      mlFeedback: {
        isCorrect: mlFeedback === 'correct',
        errorReason: mlFeedback === 'incorrect' ? errorReason : null,
        userComment: customComment || null,
        validatedAt: new Date().toISOString(),
        detectedClass: validationAlert.label,
        originalDetectedClass: event.tipo,
        alertUrgency: validationAlert.urgency,
        alertConfidence: validationAlert.confidence ?? null,
      }
    };

    if (onValidate) {
      onValidate(event.id, status, validationPayload);
    }

    // Reset dos campos de feedback mantendo o modal aberto para a próxima ocorrência
    setMlFeedback(null);
    setErrorReason('');
    setCustomComment('');
  };

  return (
    <PopupModal
      isOpen={true}
      onClose={onClose}
      title={`Auditoria da IA — Evento #${event.id}`}
      icon={Cpu}
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4">

        <div className="flex flex-wrap items-center justify-between gap-2">
          {hasTwoFrames && (
            <div className="flex gap-2">
              {['frontal', 'lateral'].map((source) => (
                <button key={source} type="button" aria-pressed={frameSource === source} onClick={() => setFrameSource(source)} className={`px-3 py-2 rounded-lg border text-xs ${frameSource === source ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-theme-divider text-theme-muted'}`}>
                  {source === 'frontal' ? 'Câmera frontal' : 'Câmera lateral'}
                </button>
              ))}
            </div>
          )}
          <OverlayVisibilityControls
            details={event.detectionDetails}
            source={frameSource}
            hasLateralFrame={!!hasTwoFrames}
            showEpi={showEpi}
            showReba={showReba}
            onToggleEpi={() => setShowEpi((visible) => !visible)}
            onToggleReba={() => setShowReba((visible) => !visible)}
          />
        </div>

        {/* Frame e marcações compartilham a mesma escala e proporção. */}
        <div className="w-full relative">
          <IncidentCanvas
            imgUrl={frameUrl}
            details={event.detectionDetails}
            source={frameSource}
            showEpi={showEpi}
            showReba={showReba}
            hasLateralFrame={!!hasTwoFrames}
          />

          {/* Botão Anterior */}
          {total > 1 && (
            <button
              type="button"
              onClick={onPrev}
              disabled={index === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/10 backdrop-blur-sm"
              title="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Botão Próximo */}
          {total > 1 && (
            <button
              type="button"
              onClick={onNext}
              disabled={index === total - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/10 backdrop-blur-sm"
              title="Próximo"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* Indicador de Quantidade/Posição */}
          {total > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/90">
              {index + 1} de {total}
            </div>
          )}
        </div>
        {!event.detectionDetails && <p className="text-xs text-theme-muted">Esta ocorrência não possui coordenadas de detecção salvas para exibir as marcações.</p>}

        {/* INFORMAÇÕES DO EVENTO ATUAL */}
        <div className="p-3 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider text-xs grid grid-cols-2 gap-2 font-mono">
          <div><strong className="text-theme-main">Detecção:</strong> {event.tipo}</div>
          <div><strong className="text-theme-main">Local:</strong> {event.setor}</div>
          <div><strong className="text-theme-main">Câmera:</strong> {event.camera}</div>
          <div><strong className="text-theme-main">Horário:</strong> {event.timestamp}</div>
        </div>

        {/* CAMPOS DE AUDITORIA DE IA */}
        <div className="p-3.5 rounded-xl border border-theme-divider bg-theme-hover/20 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-main">
            <Cpu size={16} className="text-blue-500" />
            <span>Avaliação de Acurácia do Modelo</span>
          </div>

          <p className="text-xs text-theme-muted">
            A IA rotulou este evento como <strong className={ALERT_TEXT_COLORS[validationAlert.urgency]}>{validationAlert.label}{validationAlert.confidence !== undefined ? ` • Confiança: ${(validationAlert.confidence * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : ''}</strong>. Esta detecção está correta?
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
              onClick={onClose}
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
  );
}
