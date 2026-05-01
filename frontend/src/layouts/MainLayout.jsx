// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { AiChatSidebar } from '../features/chatAi/AiChatSidebar';

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[#16171d] flex flex-col overflow-hidden">
      {/* Header fixo com a sua NavBar */}
      <header className="w-full bg-[#1a1b23] border-b border-white/5 sticky top-0 z-50">
        <NavBar />
      </header>

      {/* Área de conteúdo dinâmico */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* O Outlet renderiza LogsPage, MonitoramentoPage, etc. */}
        <Outlet />
      </main>

      {/* Componentes Globais persistentes */}
      <AiChatSidebar />
    </div>
  );
};