import { create } from 'zustand';

export const useUiStore = create((set) => ({
  // Estado de Tema Global do Sistema ("light" | "dynamic" | "dark")
  theme: "dynamic",
  
  // Rotação de estados cíclica: light -> dynamic -> dark -> light
  toggleTheme: () => set((state) => {
    const nextTheme = 
      state.theme === 'light' ? 'dynamic' : 
      state.theme === 'dynamic' ? 'dark' : 'light';
    return { theme: nextTheme };
  }),
  
  // Permite setar um tema específico se necessário por configuração direta
  setTheme: (newTheme) => set({ theme: newTheme }),

  // Estado para a Sidebar de Configurações (Relatório)
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),

  // Estado para a Sidebar da IA
  isAiSidebarOpen: false, 
  toggleAiSidebar: () => set((state) => ({ isAiSidebarOpen: !state.isAiSidebarOpen })),
  closeAiSidebar: () => set({ isAiSidebarOpen: false }),

  // Estado para a Envio de resumo e download para PDF do relatorio.
  isPopUpModalOpen: false,
  openPopUpModal: (data) => set({ isPopUpModalOpen: true, reportData: data }),
  closePopUpModal: () => set({ isPopUpModalOpen: false, reportData: null }),
  togglePopUpModal: () => set((state) => ({ isPopUpModalOpen: !state.isPopUpModalOpen })),
}));