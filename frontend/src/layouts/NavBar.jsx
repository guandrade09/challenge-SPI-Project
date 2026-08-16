import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Camera, BarChart3, FileText, Home, 
  User, Settings, LogOut, ShieldCheck, Bell 
} from 'lucide-react';
import { ThemeToggleButton } from '../components/ui/ThemeToggleButton';
import { useAuthStore } from '../store/useAuthStore'; // Puxa seu estado de Auth
import logoCodexis from '../assets/codexis/logo_codexis.svg';

export const NavBar = ({ theme }) => {
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false); // Menu de Navegação (Mobile)
  const [isConfigOpen, setIsConfigOpen] = useState(false);   // Menu do Usuário/Configs
  const location = useLocation();
  const configRef = useRef(null);

  // Zustand Store de Autenticação (Puxa usuário e função de logout)
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const navItems = [
    { label: 'Início', path: '/', icon: Home },
    { label: 'Câmeras', path: '/camera', icon: Camera },
    { label: 'Monitoramento', path: '/monitoramento', icon: BarChart3 },
    { label: 'Logs & Relatórios', path: '/logs', icon: FileText },
  ];

  // Fecha menus ao mudar de página
  useEffect(() => {
    setIsNavMenuOpen(false);
    setIsConfigOpen(false);
  }, [location.pathname]);

  // Fecha o dropdown de configurações se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (configRef.current && !configRef.current.contains(event.target)) {
        setIsConfigOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (logout) logout();
    setIsConfigOpen(false);
  };

  return (
    <nav className="w-full px-4 py-3 flex items-center justify-between relative bg-[#1a1b23] border-b border-white/5 z-50">
      
      {/* 1. LADO ESQUERDO: Botão Hambúrguer de Configurações + Logo */}
      <div className="flex items-center gap-3 relative" ref={configRef}>
        <button
          onClick={() => setIsConfigOpen((prev) => !prev)}
          className={`p-2 rounded-lg transition-all focus:outline-none ${
            isConfigOpen 
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          title="Menu do Usuário e Configurações"
          aria-label="Abrir Configurações"
        >
          {isConfigOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="flex items-center gap-2">
          <img src={logoCodexis} alt="Codexis Logo" className="h-7 w-auto" />
        </Link>

        {/* --- DROPDOWN DE CONFIGURAÇÕES DO USUÁRIO --- */}
        {isConfigOpen && (
          <div className="absolute top-12 left-0 w-72 bg-[#1c1d26] border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-[fadeIn_0.15s_ease-out]">
            {/* Perfil Simplificado */}
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/5">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-white truncate">
                  {user?.name || 'Operador Codexis'}
                </span>
                <span className="text-xs text-gray-400 truncate">
                  {user?.email || 'operador@codexis.com'}
                </span>
              </div>
            </div>

            {/* Opções de Configuração */}
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors w-full text-left"
              >
                <Settings size={16} className="text-gray-400" />
                <span>Configurações do Sistema</span>
              </button>

              <button 
                onClick={() => setIsConfigOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors w-full text-left"
              >
                <ShieldCheck size={16} className="text-gray-400" />
                <span>Permissões & Segurança</span>
              </button>

              <button 
                onClick={() => setIsConfigOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors w-full text-left"
              >
                <Bell size={16} className="text-gray-400" />
                <span>Notificações</span>
              </button>

              <div className="my-1 border-t border-white/5" />

              {/* Botão de Logout */}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left font-medium"
              >
                <LogOut size={16} />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. MENU NAVEGAÇÃO DESKTOP (Início, Câmeras, etc.) */}
      <div className="hidden md:flex items-center gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive 
                  ? 'text-blue-400 font-semibold' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 3. LADO DIREITO: Tema + Menu de Navegação para Mobile */}
      <div className="flex items-center gap-3">
        <ThemeToggleButton theme={theme} />

        {/* Botão para abrir os Links de Navegação no Mobile */}
        <button
          onClick={() => setIsNavMenuOpen((prev) => !prev)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 md:hidden focus:outline-none"
          aria-label="Abrir Menu de Navegação"
        >
          {isNavMenuOpen ? <X size={22} /> : <Camera size={22} />}
        </button>
      </div>

      {/* 4. GAVETA DE NAVEGAÇÃO MOBILE */}
      {isNavMenuOpen && (
        <div className="fixed inset-0 top-[57px] bg-[#16171d]/95 backdrop-blur-md z-40 flex flex-col p-6 animate-[fadeIn_0.2s_ease-out] md:hidden">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2">Navegação Principal</span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-base font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;