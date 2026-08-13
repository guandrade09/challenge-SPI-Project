import { useState } from 'react';
import { Home, Camera, CctvIcon, LogsIcon, Settings, LogOut, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from "../utils/cn";
import { AiToggleButton } from '../features/chatAi/AiToggleButton';
import { ThemeToggleButton } from '../components/ui/ThemeToggleButton'; // Novo Import
import { useAuthStore } from '../store/useAuthStore';

const navItems = [
  { id: 'home',    icon: Home,       label: 'Home',           path: '/' },
  { id: 'logs',    icon: LogsIcon,  label: 'Logs',           path: '/logs' },
//  { id: 'camera',  icon: Camera,    label: 'Camera',    path: '/camera' },
// { id: 'settings', icon: Settings,   label: 'Configurações',   path: '/settings' },
  { id: 'monitoramento', icon: CctvIcon,    label: 'Monitoramentos',    path: '/monitoramento' },
  { id: 'logout',  icon: LogOut,    label: 'Logout',           path: '/logout' },
];

export const NavBar = () => {
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const token = useAuthStore((s) => s.token);

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleToken = () => {
    setShowToken((p) => !p);
    setCopied(false);
  };

  return (
    <nav className="w-full flex justify-center items-center py-3 bg-neutral-900/90 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      <div className="flex items-center gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            title={item.label}
            className={({ isActive }) => cn(
              "transition-all duration-300 border-b-2 pb-1 mx-6 px-3 py-1.5 rounded-md",
              isActive
                ? "text-white border-white opacity-100 animate-pulse"
                : "text-zinc-300/70 border-transparent hover:text-white hover:opacity-100 hover:bg-white/5"
            )}
          >
            {({ isActive }) => (
              <item.icon size={24} strokeWidth={isActive ? 2 : 1.5} />
            )}
          </NavLink>
        ))}

        <div className="w-[1px] h-6 bg-white/10 mx-2" />

        {/* Token debug toggle */}
        {token && (
          <div className="relative ml-2 flex items-center gap-1">
            <button
              onClick={toggleToken}
              title={showToken ? 'Ocultar token' : 'Ver token'}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            {showToken && (
              <div className="absolute top-full right-0 mt-2 bg-neutral-800 border border-white/10 rounded-xl shadow-2xl p-4 w-80 z-[100] animate-in fade-in slide-in-from-top-2">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Token da Sessão</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[10px] font-mono text-green-400 bg-black/40 rounded px-2 py-1 break-all leading-tight">
                    {token}
                  </code>
                  <button
                    onClick={copyToken}
                    title="Copiar token"
                    className="shrink-0 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[8px] text-zinc-500 mt-2">Token expira em 1h. Copiar? Use com responsabilidade.</p>
                <button
                  onClick={toggleToken}
                  className="mt-3 w-full py-1.5 text-[10px] font-bold text-zinc-400 bg-neutral-700 hover:bg-neutral-600 rounded-lg uppercase tracking-widest transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botão de Controle de Tema do Sistema */}
        <div className="ml-2 mr-4">
          <ThemeToggleButton />
        </div>

        <div className="mx-2 text-white animate-pulse">
          <AiToggleButton />
        </div>
      </div>
    </nav>
  );
};