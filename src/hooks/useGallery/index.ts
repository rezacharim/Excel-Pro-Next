// src/hooks/useGallery/Gallery.ts
import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import useGalleryStore, { GalleryItem } from '@/stores/gallerystore';

interface CreateGalleryDto {
  title: string;
  caption?: string;
}

interface UpdateGalleryDto {
  caption: string;
}

// Hook for listing gallery items with filtering, sorting, and searching
export const useGalleryList = () => {
  const { items, isLoading, error, fetchItems } = useGalleryStore();
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string | null>(null); // 'image', 'video', etc.
  const [sortBy, setSortBy] = useState<string | null>(null); // 'newest' or 'oldest'
  
  // Media types for filtering
  const mediaTypes: string[] = ["image", "video", "document"];
  
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
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.caption && item.caption.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply media type filter
    if (filterType) {
      result = result.filter((item) => item.mime_type.startsWith(filterType));
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
  }, [items, searchQuery, filterType, sortBy]);
  
  // Load data on mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  
  // Toggle filter
  const toggleFilter = (type: string): void => {
    setFilterType(filterType === type ? null : type);
  };
  
  // Toggle sort
  const toggleSort = (type: string): void => {
    setSortBy(sortBy === type ? null : type);
  };
  
  // Clear all filters
  const clearFilters = (): void => {
    setSearchQuery("");
    setFilterType(null);
    setSortBy(null);
  };
  
  return {
    items,
    filteredItems,
    loading: isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filterType,
    sortBy,
    toggleFilter,
    toggleSort,
    clearFilters,
    mediaTypes,
    refresh,
  };
};

// Hook for creating new gallery items
export const useCreateGallery = () => {
  const { uploadItem } = useGalleryStore();
  const [formData, setFormData] = useState<CreateGalleryDto>({
    title: "",
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
  const handleAddGalleryItem = async (token: string): Promise<GalleryItem | null> => {
    if (!selectedFile) {
      return null;
    }
    
    const uploadFormData = new FormData();
    uploadFormData.append("file", selectedFile);
    uploadFormData.append("title", formData.title);
    if (formData.caption) {
      uploadFormData.append("caption", formData.caption);
    }

    console.log(token)
    
    const result = await uploadItem(uploadFormData, token);
    if (result) {
      resetForm();
      return result;
    }
    
    return null;
  };
  
  // Reset form
  const resetForm = (): void => {
    setFormData({ title: "", caption: "" });
    setSelectedFile(null);
    setPreviewUrl(null);
  };
  
  return {
    formData,
    selectedFile,
    previewUrl,
    handleFileChange,
    handleInputChange,
    handleAddGalleryItem,
    resetForm,
  };
};

// Hook for updating gallery items
export const useUpdateGallery = () => {
  const { updateItem } = useGalleryStore();
  const [formData, setFormData] = useState<UpdateGalleryDto>({
    caption: "",
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
  
  // Update handler
  const handleUpdateGalleryItem = async (id: string, token: string): Promise<boolean> => {
    const result = await updateItem(id, formData.caption, token);
    return result !== null;
  };
  
  return {
    formData,
    handleInputChange,
    handleUpdateGalleryItem,
    setFormData,
  };
};

// Hook for deleting gallery items
export const useDeleteGallery = () => {
  const { deleteItem } = useGalleryStore();
  
  // Delete handler
  const deleteGalleryItem = async (id: string, token: string): Promise<boolean> => {
    return await deleteItem(id, token);
  };
  
  return { deleteGalleryItem };
};

// Helper hook for formatting
export const useGalleryFormatters = () => {
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };
  
  // Get item type from mime type
  const getItemType = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType.startsWith("video/")) return "Video";
    if (mimeType.startsWith("audio/")) return "Audio";
    return "Document";
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
    getItemType,
    formatDate,
  };
};