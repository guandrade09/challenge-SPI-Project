import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSystemConfigStore = create(persist((set) => ({
  fallPopupEnabled: true,
  invasionPopupEnabled: true,
  setFallPopupEnabled: (enabled) => set({ fallPopupEnabled: Boolean(enabled) }),
  setInvasionPopupEnabled: (enabled) => set({ invasionPopupEnabled: Boolean(enabled) }),
}), {
  name: 'spi-system-config',
  partialize: ({ fallPopupEnabled, invasionPopupEnabled }) => ({ fallPopupEnabled, invasionPopupEnabled }),
}));
