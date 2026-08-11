import { create } from 'zustand';

export interface GalleryItem {
  id: string;
  title: string;
  file_name: string;
  storage_filename: string;
  image_url: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  caption: string | null;
  created_at?: string;
  updated_at?: string;
}

interface GalleryState {
  items: GalleryItem[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  uploadItem: (formData: FormData, token: string) => Promise<GalleryItem | null>;
  updateItem: (id: string, caption: string, token: string) => Promise<GalleryItem | null>;
  deleteItem: (id: string, token: string) => Promise<boolean>;
}

const useGalleryStore = create<GalleryState>((set) => ({
  items: [],
  isLoading: false,
  error: null,
  
  fetchItems: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gallery`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gallery items');
      }
      
      const data = await response.json();
      set({ items: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch gallery items', 
        isLoading: false 
      });
    }
  },
  
  uploadItem: async (formData: FormData, token: string): Promise<GalleryItem | null> => {
    set({ isLoading: true, error: null });
    try {
      console.log('upload',token)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gallery`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const newItem: GalleryItem = await response.json();
      set((state) => ({ 
        items: [...state.items, newItem], 
        isLoading: false,
      }));
      
      return newItem;
    } catch (error) {
      console.error('Error uploading file:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to upload file', 
        isLoading: false 
      });
      return null;
    }
  },
  
  updateItem: async (id: string, caption: string, token: string): Promise<GalleryItem | null> => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gallery/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caption }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      
      const updatedItem: GalleryItem = await response.json();
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updatedItem : item)),
        isLoading: false,
      }));
      
      return updatedItem;
    } catch (error) {
      console.error('Error updating item:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update item', 
        isLoading: false 
      });
      return null;
    }
  },
  
  deleteItem: async (id: string, token: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gallery/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete item', 
        isLoading: false 
      });
      return false;
    }
  },
}));

export default useGalleryStore;