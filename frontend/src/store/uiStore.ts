import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  activeModal: string | null;
  openModal: (name: string) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      darkMode: false,
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode;
          if (next) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: next };
        }),
      activeModal: null,
      openModal: (name) => set({ activeModal: name }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ darkMode: state.darkMode }),
    }
  )
);
