import { create } from "zustand";

interface AdminNavState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAdminNavStore = create<AdminNavState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
