import { create } from 'zustand';

export const useUiStore = create((set) => ({
  // Estado para a Sidebar de Configurações (Relatório)
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),

  // Estado para a Sidebar da IA (O que o seu botão chama)
  isAiSidebarOpen: false, 
  toggleAiSidebar: () => set((state) => ({ isAiSidebarOpen: !state.isAiSidebarOpen })),
  closeAiSidebar: () => set({ isAiSidebarOpen: false }),

  isReportModalOpen: false,
  toggleReportModal: () => set((state) => ({ isReportModalOpen: !state.isReportModalOpen })),
  closeReportModal: () => set({ isReportModalOpen: false }),
}));