import { create } from 'zustand';

export const useUiStore = create((set) => ({
  // Estado para a Sidebar de Configurações (Relatório)
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),

  // Estado para a Sidebar da IA (O que o seu botão chama) la ele
  isAiSidebarOpen: false, 
  toggleAiSidebar: () => set((state) => ({ isAiSidebarOpen: !state.isAiSidebarOpen })),
  closeAiSidebar: () => set({ isAiSidebarOpen: false }),

  // Estado para a Envio de resumo e download para PDF do relatorio.
  isPopUpModalOpen: false,
  // Função para abrir
  openPopUpModal: () => set({ isPopUpModalOpen: true }),
  // Função para fechar
  closePopUpModal: () => set({ isPopUpModalOpen: false }),
  // Função para alternar (opcional)
  togglePopUpModal: () => set((state) => ({ isPopUpModalOpen: !state.isPopUpModalOpen })),
}));