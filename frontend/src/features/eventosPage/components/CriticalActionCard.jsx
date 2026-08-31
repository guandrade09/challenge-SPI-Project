import React, { useState, useMemo, useEffect } from 'react';
import { ShieldAlert, Check, X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import imgNotFound from '../../../assets/Codexis/img-not-found.jpg';

export function CriticalActionCard({ events = [], onValidate }) {
  // 1. Filtra apenas os eventos que são CRÍTICOS (gravidade alta) E estão PENDENTES
  const pendingCriticalEvents = useMemo(() => {
    return events.filter(
      (evt) =>
        (evt.gravidade === 'alta' || evt.gravidade === 'critico') &&
        evt.status === 'Pendente'
    );
  }, [events]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Ajusta o índice do carrossel caso a lista encolha após uma validação
  useEffect(() => {
    if (currentIndex >= pendingCriticalEvents.length && pendingCriticalEvents.length > 0) {
      setCurrentIndex(pendingCriticalEvents.length - 1);
    }
  }, [pendingCriticalEvents.length, currentIndex]);

  const currentEvent = pendingCriticalEvents[currentIndex] || null;

  const handleNext = () => {
    if (currentIndex < pendingCriticalEvents.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleAction = (id, status) => {
    if (onValidate) {
      onValidate(id, status);
    }
  };

  return (
    <div className="flex flex-col p-4 rounded-2xl border border-[var(--risk-alert-border)] bg-[var(--risk-alert-bg)] relative overflow-hidden shadow-md">
      {/* Badge Superior */}
      <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white text-[9px] font-mono font-bold uppercase tracking-wider rounded-bl-lg shadow-sm">
        Ação Imediata
      </div>

      {/* Header do Card com Contadores */}
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
          {/* Controles do Carrossel e Informações do Evento */}
          <div className="flex items-center justify-between bg-[var(--p-header-bg)] p-2 rounded-lg border border-theme-divider">
            <div className="text-xs text-theme-muted font-mono truncate">
              ID: <span className="text-theme-main font-bold">{currentEvent.id}</span> | {currentEvent.timestamp}
            </div>

            {/* Navegação entre Ocorrências Pendentes */}
            {pendingCriticalEvents.length > 1 && (
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="p-1 rounded bg-[var(--p-bg)] hover:bg-theme-hover disabled:opacity-30 disabled:cursor-not-allowed text-theme-main transition-colors"
                  title="Ocorrência Anterior"
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
                  title="Próxima Ocorrência"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Dados Principais */}
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

          {/* Imagem com Fallback para Erros de Carregamento */}
          <div className="w-full h-36 rounded-lg overflow-hidden border border-theme-divider bg-black/20 relative group">
            <img
              src={currentEvent.imagem || imgNotFound}
              alt={`Ocorrência Crítica ${currentEvent.id}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = imgNotFound;
              }}
            />
          </div>

          <p className="text-[11px] text-theme-muted">
            Confirme se a infração detectada pelo sistema é procedente:
          </p>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => handleAction(currentEvent.id, 'Validado')}
              className="icon-btn-success text-xs uppercase tracking-wider py-2 flex items-center justify-center"
            >
              <Check size={14} className="mr-1" />
              Procedente
            </button>

            <button
              onClick={() => handleAction(currentEvent.id, 'Descartado')}
              className="icon-btn-cancel text-xs uppercase tracking-wider py-2 flex items-center justify-center"
            >
              <X size={14} className="mr-1" />
              Falso Alarme
            </button>
          </div>
        </div>
      ) : (
        /* Estado Vazio (Sem Críticos Pendentes) */
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
  );
}

export default CriticalActionCard;