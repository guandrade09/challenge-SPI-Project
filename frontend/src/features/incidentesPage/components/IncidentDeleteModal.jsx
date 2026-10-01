import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X } from 'lucide-react';
import { useUiStore } from '../../../store/useUiStore';

export default function IncidentDeleteModal({ count, busy, error, onClose, onConfirm }) {
  const theme = useUiStore((state) => state.theme);
  const cancelRef = useRef(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  return createPortal(
    <div className={`panel-theme-${theme} font-theme-body`}>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0" style={{ backgroundColor: 'var(--p-overlay)' }} />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="incident-delete-title"
          className="relative z-10 w-full max-w-md rounded-xl border border-[var(--p-border)] bg-[var(--p-bg)] p-5 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="incident-delete-title" className="text-lg font-semibold text-theme-title">Deletar {count === 1 ? 'incidente' : 'incidentes'}?</h2>
              <p className="mt-2 text-sm text-theme-muted">
                {count} {count === 1 ? 'incidente será removido' : 'incidentes serão removidos'} do banco.
                Frames sem outras referências também serão excluídos do servidor. Esta ação não pode ser desfeita.
              </p>
            </div>
            <button type="button" onClick={onClose} disabled={busy} aria-label="Fechar confirmação" className="icon-btn-ghost disabled:opacity-40"><X size={18} /></button>
          </div>
          {error && <p className="mt-4 text-sm text-red-500" role="alert">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button ref={cancelRef} type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-[var(--p-border)] px-4 py-2 text-sm text-theme-main disabled:opacity-40">Cancelar</button>
            <button type="button" onClick={onConfirm} disabled={busy} className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/25 disabled:opacity-40">
              <Trash2 size={15} /> {busy ? 'Deletando...' : 'Deletar'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
