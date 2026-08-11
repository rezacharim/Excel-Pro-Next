// src/hooks/usePlayerMonth/usePlayerMonth.ts
import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import usePlayerMonthStore, { PlayerMonthItem } from '@/stores/playerMonthStore';

interface CreatePlayerMonthDto {
  player_name: string;
  caption?: string;
}

interface UpdatePlayerMonthDto {
  player_name?: string;
  caption?: string;
}

// Hook for listing player month items with filtering, sorting, and searching
export const usePlayerMonthList = () => {
  const { items, isLoading, error, fetchItems } = usePlayerMonthStore();
  const [filteredItems, setFilteredItems] = useState<PlayerMonthItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string | null>(null); // 'newest' or 'oldest'
  
  // Refresh data
  const refresh = useCallback(async (): Promise<void> => {
    await fetchItems();
  }, [fetchItems]);
  
  // Filter and sort items
  useEffect(() => {
    let result = [...items];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.caption && item.caption.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply sorting
    if (sortBy === "newest") {
      result.sort((a, b) => {
        return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
      });
    } else if (sortBy === "oldest") {
      result.sort((a, b) => {
        return new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime();
      });
    }
    
    setFilteredItems(result);
  }, [items, searchQuery, sortBy]);
  
  // Load data on mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  
  // Toggle sort
  const toggleSort = (type: string): void => {
    setSortBy(sortBy === type ? null : type);
  };
  
  // Clear all filters
  const clearFilters = (): void => {
    setSearchQuery("");
    setSortBy(null);
  };
  
  return {
    items,
    filteredItems,
    loading: isLoading,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    toggleSort,
    clearFilters,
    refresh,
  };
};

// Hook for creating new player month items
export const useCreatePlayerMonth = () => {
  const { uploadItem } = usePlayerMonthStore();
  const [formData, setFormData] = useState<CreatePlayerMonthDto>({
    player_name: "",
    caption: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Upload handler
  const handleAddPlayerMonthItem = async (token: string): Promise<PlayerMonthItem | null> => {
    if (!selectedFile) {
      return null;
    }
    
    const uploadFormData = new FormData();
    uploadFormData.append("file", selectedFile);
    uploadFormData.append("player_name", formData.player_name);
    
    if (formData.caption) {
      uploadFormData.append("caption", formData.caption);
    }
    
    const result = await uploadItem(uploadFormData, token);
    if (result) {
      resetForm();
      return result;
    }
    
    return null;
  };
  
  // Reset form
  const resetForm = (): void => {
    setFormData({
      player_name: "",
      caption: "",
    });
    setSelectedFile(null);
    setPreviewUrl(null);
  };
  
  return {
    formData,
    selectedFile,
    previewUrl,
    handleFileChange,
    handleInputChange,
    handleAddPlayerMonthItem,
    resetForm,
  };
};

// Hook for updating player month items
export const useUpdatePlayerMonth = () => {
  const { updateItem } = usePlayerMonthStore();
  const [formData, setFormData] = useState<UpdatePlayerMonthDto>({
    caption: "",
    player_name: "",
  });
  
  // Handle form input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Set form data based on existing item
  const setInitialFormData = (item: PlayerMonthItem): void => {
    setFormData({
      caption: item.caption || "",
      player_name: item.player_name,
    });
  };
  
  // Update handler
  const handleUpdatePlayerMonthItem = async (id: string, token: string): Promise<boolean> => {
    const updateData = { ...formData };
    const result = await updateItem(id, updateData, token);
    return result !== null;
  };
  
  return {
    formData,
    handleInputChange,
    handleUpdatePlayerMonthItem,
    setFormData,
    setInitialFormData,
  };
};

// Hook for deleting player month items
export const useDeletePlayerMonth = () => {
  const { deleteItem } = usePlayerMonthStore();
  
  // Delete handler
  const deletePlayerMonthItem = async (id: string, token: string): Promise<boolean> => {
    return await deleteItem(id, token);
  };
  
  return { deletePlayerMonthItem };
};

// Helper hook for formatting
export const usePlayerMonthFormatters = () => {
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };
  
  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  return {
    formatFileSize,
    formatDate,
  };
};