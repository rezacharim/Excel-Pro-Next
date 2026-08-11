import { create } from 'zustand';

interface MenuState {
  // Current active menu ID
  activeMenuId: number;
  
  // Action to set the active menu ID
  setActiveMenuId: (id: number) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  // Initial menu ID (0 for overview)
  activeMenuId: 0,
  
  // Action to set active menu ID
  setActiveMenuId: (id) => set({ activeMenuId: id }),
}));