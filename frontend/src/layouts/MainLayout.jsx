// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { AiChatSidebar } from '../features/chatAi/AiChatSidebar';
import { AiToggleButton } from '../features/chatAi/AiToggleButton';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import { useUiStore } from '../store/useUiStore';
import { useIsMobile } from '../hooks/useIsMobile';

import bannerCima from '../assets/codexis/banner_cima.jpeg'; 
import bannerBaixo from '../assets/codexis/banner_baixo.jpeg'; 

export const MainLayout = () => {
  const currentTheme = useUiStore((s) => s.theme);
  const isMobile = useIsMobile();
  useInactivityLogout();

  return (
    // 1. Alterado h-screen para min-h-screen para permitir expansão e scroll vertical
    <div className="min-h-screen w-full flex flex-col bg-[#16171d] relative">
      {/* Header Fixo no Topo */}
      <header className="w-full bg-[#1a1b23] border-b border-white/5 shrink-0 z-50 sticky top-0">
        <NavBar theme={currentTheme} />
      </header>

      {/* Área Principal + Sidebar da IA */}
      <div className="flex-1 flex relative">
        {/* Conteúdo das Páginas */}
        <main className="flex-1 flex flex-col min-w-0 bg-projeto-main3 relative">
          {/* Banners decorativos */}
          <img 
            src={bannerCima} 
            alt="Banner Superior Codexis" 
            className="absolute top-0 left-0 w-full h-32 md:h-auto object-cover md:object-top opacity-10 md:opacity-20 pointer-events-none z-0"
          />

          <img 
            src={bannerBaixo} 
            alt="Banner Inferior Codexis" 
            className="absolute bottom-0 left-0 w-full h-32 md:h-auto object-cover md:object-bottom opacity-10 md:opacity-20 pointer-events-none z-0"
          />

          {/* Container sem overflow-y-auto travando no pai, permitindo fluxo natural */}
          <div className="flex-1 flex flex-col z-10 relative p-3 sm:p-4 md:p-6">
            <Outlet />
          </div>
        </main>

        {/* Componentes do Assistente IA */}
        <AiChatSidebar theme={currentTheme} isMobile={isMobile} />
        <AiToggleButton theme={currentTheme} isMobile={isMobile} />
      </div>
    </div>
  );
};

export default MainLayout;