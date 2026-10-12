import { Bell, Settings, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useSystemConfigStore } from '../../store/useSystemConfigStore';
import { useUiStore } from '../../store/useUiStore';

function PopupSwitch({ id, title, description, enabled, onChange, icon }) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl border border-theme-divider bg-[var(--p-header-bg)] p-5 sm:p-6">
      <div className="flex min-w-0 items-start gap-4">
        <div className="hidden rounded-xl bg-blue-500/10 p-3 text-blue-400 sm:block">{icon}</div>
        <div>
          <h2 id={`${id}-title`} className="text-base font-semibold text-theme-main">{title}</h2>
          <p id={`${id}-description`} className="mt-2 max-w-lg text-sm leading-6 text-theme-muted">{description}</p>
          <p className={`mt-3 text-xs font-semibold ${enabled ? 'text-emerald-500' : 'text-theme-muted'}`}>{enabled ? 'Ativado' : 'Desativado'}</p>
        </div>
      </div>
      <button type="button" role="switch" aria-checked={enabled} aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`} onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${enabled ? 'border-blue-500 bg-blue-600' : 'border-theme-divider bg-slate-500/40'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function SystemConfigPage() {
  const theme = useUiStore((state) => state.theme);
  const fallEnabled = useSystemConfigStore((state) => state.fallPopupEnabled);
  const invasionEnabled = useSystemConfigStore((state) => state.invasionPopupEnabled);
  const setFallEnabled = useSystemConfigStore((state) => state.setFallPopupEnabled);
  const setInvasionEnabled = useSystemConfigStore((state) => state.setInvasionPopupEnabled);

  return (
    <div className={`panel-theme-${theme} min-h-screen w-full bg-[var(--p-bg)] font-theme-body transition-colors`}>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <header className="border-b border-theme-divider pb-6">
          <div className="mb-3 flex items-center gap-2 text-sm text-theme-muted"><Settings size={18} /> Preferências do sistema</div>
          <h1 className="text-2xl font-theme-title text-theme-main sm:text-3xl">Configurações do Sistema</h1>
          <p className="mt-3 text-sm leading-6 text-theme-muted">Controle os popups de alerta exibidos durante o monitoramento de todas as câmeras.</p>
        </header>
        <section aria-labelledby="popup-settings-title" className="space-y-4">
          <h2 id="popup-settings-title" className="flex items-center gap-2 text-lg font-semibold text-theme-main"><Bell size={20} /> Popups de alerta</h2>
          <PopupSwitch id="fall-popup" title="Popup de queda" description="Exibir um popup quando uma possível queda for detectada." icon={<AlertTriangle size={22} />} enabled={fallEnabled} onChange={setFallEnabled} />
          <PopupSwitch id="invasion-popup" title="Popup de invasão" description="Exibir um popup quando uma pessoa entrar em uma zona de risco delimitada." icon={<ShieldAlert size={22} />} enabled={invasionEnabled} onChange={setInvasionEnabled} />
        </section>
        <p className="rounded-xl border border-theme-divider p-4 text-sm leading-6 text-theme-muted">As alterações são salvas automaticamente neste navegador. Desativar um popup mantém a detecção e o registro das ocorrências ativos. Ao reativar, serão exibidos somente novos alertas.</p>
      </main>
    </div>
  );
}
