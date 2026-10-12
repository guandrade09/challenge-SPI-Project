import { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import PopupModal from '../../../components/shared/PopupModal';
import { useUiStore } from '../../../store/useUiStore';

export function EventDeleteModal({ event, busy, error, onClose, onConfirm }) {
  const theme = useUiStore((state) => state.theme);
  const cancelRef = useRef(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  return (
    <PopupModal isOpen onClose={onClose} title="Excluir ocorrência" icon={Trash2} theme={theme}>
      <p className="text-sm text-theme-main break-words">Excluir a ocorrência #{event.id} ({event.tipo})? Esta ação é permanente.</p>
      {error && <p className="mt-3 text-sm text-red-500" role="alert">{error}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button ref={cancelRef} type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-theme-divider px-4 py-2 text-sm text-theme-main disabled:opacity-40">Cancelar</button>
        <button type="button" onClick={onConfirm} disabled={busy} className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 disabled:opacity-40">
          <Trash2 size={15} /> {busy ? 'Excluindo...' : 'Excluir ocorrência'}
        </button>
      </div>
    </PopupModal>
  );
}
