// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { AiChatSidebar } from '../features/chatAi/AiChatSidebar';
import { AiToggleButton } from '../features/chatAi/AiToggleButton';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import { useUiStore } from '../store/useUiStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { GlobalFallAlert } from '../components/alerts/GlobalFallAlert';

export const MainLayout = () => {
  const currentTheme = useUiStore((s) => s.theme);
  const isMobile = useIsMobile();
  useInactivityLogout();

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-tr from-blue-900 via-[#0f172a] to-[#090d16] text-slate-100 relative">
      {/* Header Fixo no Topo */}
      <header className="w-full bg-[#0a0f1d]/70 backdrop-blur-md border-b border-white/10 shrink-0 z-50 sticky top-0">
        <NavBar theme={currentTheme} />
      </header>

      {/* Área Principal + Sidebar da IA */}
      <div className="flex-1 flex relative">
        {/* Conteúdo das Páginas */}
        <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
          <div className="flex-1 flex flex-col z-10 relative p-3 sm:p-4 md:p-6">
            <Outlet />
          </div>

          {/* Footer Minimalista */}
          <Footer />
        </main>

        {/* Componentes do Assistente IA */}
        <AiChatSidebar theme={currentTheme} isMobile={isMobile} />
        <AiToggleButton theme={currentTheme} isMobile={isMobile} />
      </div>
      <GlobalFallAlert />
    </div>
  );
};

export default MainLayout;
