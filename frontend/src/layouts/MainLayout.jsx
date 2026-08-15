import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { AiChatSidebar } from '../features/chatAi/AiChatSidebar';
import { AiToggleButton } from '../features/chatAi/AiToggleButton';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import { useUiStore } from '../store/useUiStore';

import bannerCima from '../assets/codexis/banner_cima.jpeg'; 
import bannerBaixo from '../assets/codexis/banner_baixo.jpeg'; 

export const MainLayout = () => {
  const currentTheme = useUiStore((s) => s.theme);
  useInactivityLogout();

  return (
    <div className="min-h-screen bg-[#16171d] flex flex-col overflow-hidden">
      <header className="w-full bg-[#1a1b23] border-b border-white/5 sticky top-0 z-50">
        <NavBar theme={currentTheme} />
      </header>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-projeto-main3 relative">
        <img 
          src={bannerCima} 
          alt="Banner Superior Codexis" 
          className="absolute top-0 left-0 w-full h-auto object-top opacity-20 pointer-events-none z-0"
        />

        <img 
          src={bannerBaixo} 
          alt="Banner Inferior Codexis" 
          className="absolute bottom-0 left-0 w-full h-auto object-bottom opacity-20 pointer-events-none z-0"
        />

        <div className="flex-1 flex flex-col min-h-0 z-10 relative overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Botão Flutuante e Barra Lateral de IA */}
      <AiToggleButton  theme={currentTheme}/>
      <AiChatSidebar theme={currentTheme}/>
    </div>
  );
};