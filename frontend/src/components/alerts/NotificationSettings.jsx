import { useSystemConfigStore } from '../../store/useSystemConfigStore';
import { useUiStore } from '../../store/useUiStore';

function PopupSwitch({ id, title, description, enabled, onChange }) {
  return (
    <li className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p id={`${id}-title`} className="text-xs font-semibold text-theme-main">{title}</p>
        <p id={`${id}-description`} className="mt-1 text-[11px] leading-4 text-theme-muted">{description}</p>
      </div>
      <button type="button" role="switch" aria-checked={enabled} aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`} onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${enabled ? 'border-blue-500 bg-blue-600' : 'border-theme-divider bg-slate-500/40'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'}`} />
      </button>
    </li>
  );
}

export default function NotificationSettings() {
  const theme = useUiStore((state) => state.theme);
  const fallEnabled = useSystemConfigStore((state) => state.fallPopupEnabled);
  const invasionEnabled = useSystemConfigStore((state) => state.invasionPopupEnabled);
  const setFallEnabled = useSystemConfigStore((state) => state.setFallPopupEnabled);
  const setInvasionEnabled = useSystemConfigStore((state) => state.setInvasionPopupEnabled);

  return (
    <section id="notification-settings" aria-labelledby="notification-settings-button" className={`panel-theme-${theme} rounded-lg border border-theme-divider bg-[var(--p-bg)] font-theme-body`}>
      <ul className="divide-y divide-[var(--p-border)]">
        <PopupSwitch id="fall-popup" title="Popup de queda" description="Avisar ao detectar uma possível queda." enabled={fallEnabled} onChange={setFallEnabled} />
        <PopupSwitch id="invasion-popup" title="Popup de invasão" description="Avisar quando alguém entrar em uma zona de risco." enabled={invasionEnabled} onChange={setInvasionEnabled} />
      </ul>
      <p className="border-t border-theme-divider p-3 text-[11px] leading-4 text-theme-muted">Salvo automaticamente neste navegador. As detecções e os registros continuam ativos. Ao reativar, somente novos alertas serão exibidos.</p>
    </section>
  );
}
