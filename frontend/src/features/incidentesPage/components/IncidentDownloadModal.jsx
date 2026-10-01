import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useUiStore } from '../../../store/useUiStore';

export default function IncidentDownloadModal({ selectedCount, busy, error, onClose, onDownload }) {
  const theme = useUiStore((state) => state.theme);
  const actions = [
    ['bounding', 'Baixar com Bounding Box'],
    ['normal', 'Baixar normal'],
    ['both', 'Baixar ambos'],
  ];
  return createPortal(
    <div className={`panel-theme-${theme} font-theme-body`}>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0" style={{ backgroundColor: 'var(--p-overlay)' }} />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="incident-download-title"
          className="relative z-10 w-full max-w-md rounded-xl border border-[var(--p-border)] bg-[var(--p-bg)] p-5 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="incident-download-title" className="text-lg font-semibold text-theme-title">Downloads</h2>
              <p className="mt-1 text-sm text-theme-muted">{selectedCount} incidentes selecionados</p>
            </div>
            <button type="button" onClick={onClose} disabled={busy} aria-label="Fechar downloads" className="icon-btn-ghost disabled:opacity-40"><X size={18} /></button>
          </div>
          {selectedCount === 0 && <p className="mt-4 text-sm text-theme-muted">Selecione incidentes para baixar.</p>}
          <div className="mt-5 flex flex-col gap-2">
            {actions.map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => onDownload(mode)}
                disabled={selectedCount === 0 || busy}
                className="w-full rounded-lg border border-[var(--p-border)] bg-[var(--p-header-bg)] px-4 py-2 text-left text-sm text-theme-main hover:border-blue-500/50 disabled:opacity-40"
              >
                {label}
              </button>
            ))}
          </div>
          {busy && <p className="mt-4 text-sm text-theme-muted" role="status">Preparando ZIP...</p>}
          {error && <p className="mt-4 text-sm text-red-500" role="alert">{error}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
