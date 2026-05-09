import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { AiChatSidebar } from '../features/chatAi/AiChatSidebar';
import { useInactivityLogout } from '../hooks/useInactivityLogout';

export const MainLayout = () => {
  // Attaches document-level event listeners to reset inactivity timer
  useInactivityLogout();

  return (
    <div className="min-h-screen bg-[#16171d] flex flex-col overflow-hidden">
      <header className="w-full bg-[#1a1b23] border-b border-white/5 sticky top-0 z-50">
        <NavBar />
      </header>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Outlet />
      </main>

      <AiChatSidebar />
    </div>
  );
};