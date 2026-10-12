import { FileText } from 'lucide-react';
import PopupModal from '../../../components/shared/PopupModal';
import { useUiStore } from '../../../store/useUiStore';
import { formatEventLongDate } from '../../../utils/eventDetails';

export function EventLogModal({ event, onClose }) {
  const theme = useUiStore((state) => state.theme);
  return (
    <PopupModal isOpen onClose={onClose} title="Detalhes do log" icon={FileText} theme={theme} maxWidth="max-w-xl">
      <div className="space-y-4 text-sm text-theme-main">
        <p className="font-semibold">{event.tipo}</p>
        <p className="text-xs text-theme-muted">{formatEventLongDate(event.rawDate)}</p>
        <pre className="rounded-lg border border-theme-divider bg-[var(--p-header-bg)] p-3 font-mono text-xs whitespace-pre-wrap break-words">{event.detalhes || 'Mensagem não disponível.'}</pre>
        <p>{event.analise}</p>
      </div>
    </PopupModal>
  );
}
