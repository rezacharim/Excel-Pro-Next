import { create } from 'zustand';

export interface PlayerMonthItem {
  id: string;
  player_name: string;
  file_name: string;
  storage_filename: string;
  image_url: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  caption?: string;
  created_at?: string;
  updated_at?: string;
}

interface PlayerMonthState {
  items: PlayerMonthItem[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  uploadItem: (formData: FormData, token: string) => Promise<PlayerMonthItem | null>;
  updateItem: (id: string, updateData: Partial<PlayerMonthItem>, token: string) => Promise<PlayerMonthItem | null>;
  deleteItem: (id: string, token: string) => Promise<boolean>;
}

const usePlayerMonthStore = create<PlayerMonthState>((set) => ({
  items: [],
  isLoading: false,
  error: null,
  
  fetchItems: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player_month`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch player month items');
      }
      
      const data = await response.json();
      set({ items: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching player month items:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch player month items', 
        isLoading: false 
      });
    }
  },
  
  uploadItem: async (formData: FormData, token: string): Promise<PlayerMonthItem | null> => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player_month`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload player month image');
      }
      
      const newItem: PlayerMonthItem = await response.json();
      set((state) => ({ 
        items: [...state.items, newItem], 
        isLoading: false,
      }));
      
      return newItem;
    } catch (error) {
      console.error('Error uploading player month image:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to upload player month image', 
        isLoading: false 
      });
      return null;
    }
  },
  
  updateItem: async (id: string, updateData: Partial<PlayerMonthItem>, token: string): Promise<PlayerMonthItem | null> => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player_month/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update player month item');
      }
      
      const updatedItem: PlayerMonthItem = await response.json();
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updatedItem : item)),
        isLoading: false,
      }));
      
      return updatedItem;
    } catch (error) {
      console.error('Error updating player month item:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update player month item', 
        isLoading: false 
      });
      return null;
    }
  },
  
  deleteItem: async (id: string, token: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player_month/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete player month item');
      }
      
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting player month item:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete player month item', 
        isLoading: false 
      });
      return false;
    }
  },
}));

export default usePlayerMonthStore;