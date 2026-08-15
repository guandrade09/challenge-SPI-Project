import React from 'react';
import { Home, CctvIcon, LogsIcon, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from "../utils/cn";
import { ThemeToggleButton } from '../components/ui/ThemeToggleButton';
import { IconButtonModal } from '../components/shared/IconButtonModal';

const navItems = [
  { id: 'home', icon: Home, label: 'Home', path: '/' },
  { id: 'logs', icon: LogsIcon, label: 'Logs', path: '/logs' },
  { id: 'monitoramento', icon: CctvIcon, label: 'Monitoramento', path: '/camera' },
];

export const NavBar = ({ theme = 'dark' }) => {
  return (
    <nav className={`panel-theme-${theme} w-full flex justify-center items-center py-2 px-6 bg-[var(--p-header-bg)] border-b border-[var(--p-border)] shadow-md sticky top-0 z-50 relative transition-colors duration-200`}>
      {/* Bloco Central: Itens Principais + Troca de Tema */}
      <div className="flex items-center gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            title={item.label}
            className={({ isActive }) => cn(
              "transition-all duration-200 border-b-2 pb-1 mx-2 sm:mx-4 px-3 py-1.5 rounded-t-md flex items-center gap-2",
              isActive
                ? "text-[var(--p-toggle-accent,#34d399)] border-[var(--p-toggle-accent,#34d399)] bg-[var(--p-bg)] font-semibold"
                : "text-theme-muted border-transparent hover:text-[var(--p-text)] hover:bg-[var(--p-bg)]"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
                <span className="hidden md:inline text-xs">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <div className="w-[1px] h-5 bg-[var(--p-border)] mx-3" />

        {/* Botão de Controle de Tema do Sistema */}
        <div className="ml-1">
          <ThemeToggleButton />
        </div>
      </div>

      {/* Ícone de Logout Fixado na Extrema Direita */}
      <div className="absolute right-6 flex items-center">
        <NavLink to="/logout" title="Sair do Sistema">
          <IconButtonModal
            icon={LogOut}
            variant="ghost"
            colorVariant="danger"
            title="Sair do sistema"
            className="!p-2"
          />
        </NavLink>
      </div>
    </nav>
  );
};

export default NavBar;  