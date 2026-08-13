import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { AiChatSidebar } from '../features/chatAi/AiChatSidebar';
import { useInactivityLogout } from '../hooks/useInactivityLogout';

// 🚀 Imports dos banners mantidos
import bannerCima from '../assets/codexis/banner_cima.jpeg'; 
import bannerBaixo from '../assets/codexis/banner_baixo.jpeg'; 

export const MainLayout = () => {
  // Attaches document-level event listeners to reset inactivity timer
  useInactivityLogout();

  return (
    <div className="min-h-screen bg-[#16171d] flex flex-col overflow-hidden">
      <header className="w-full bg-[#1a1b23] border-b border-white/5 sticky top-0 z-50">
        <NavBar />
      </header>

      {/* 🚀 O segredo está aqui: Adicionamos 'relative' para prender os banners e 'z-10' no conteúdo */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-projeto-main3 relative">
        
        {/* ================= BANNERS DENTRO DO ESCOPO DO OUTLET ================= */}
        {/* Topo do container de conteúdo */}
        <img 
          src={bannerCima} 
          alt="Banner Superior Codexis" 
          className="absolute top-0 left-0 w-full h-auto object-top opacity-20 pointer-events-none z-0"
        />

        {/* Base do container de conteúdo */}
        <img 
          src={bannerBaixo} 
          alt="Banner Inferior Codexis" 
          className="absolute bottom-0 left-0 w-full h-auto object-bottom opacity-20 pointer-events-none z-0"
        />
        {/* ===================================================================== */}

        {/* 
          O conteúdo das suas páginas (<Outlet />) renderiza aqui dentro.
          Usamos z-10 e relative para que os botões, carrossel e textos fiquem perfeitamente clicáveis por cima dos banners.
        */}
        <div className="flex-1 flex flex-col min-h-0 z-10 relative overflow-y-auto">
          <Outlet />
        </div>
        
      </main>

      <AiChatSidebar />
    </div>
  );
};