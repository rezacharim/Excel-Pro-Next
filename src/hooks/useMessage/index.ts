import { useState, useEffect, useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import { useMessageStore } from "@/stores/messageStore";

// Hook for managing the message list with filtering and sorting
export const useMessageList = () => {
  const savedToken = Cookies.get("auth_token")!;
  const {
    messages,
    loading,
    fetchMessages,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    clearFilters,
  } = useMessageStore();

  // Function to toggle sorting
  const toggleSort = (type: "newest" | "oldest") => {
    setSortBy(sortBy === type ? null : type);
  };

  // Filtered and sorted messages
  const filteredMessages = useMemo(() => {
    let result = [...messages];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (message) =>
          message.name.toLowerCase().includes(query) ||
          message.email.toLowerCase().includes(query) ||
          message.subject.toLowerCase().includes(query) ||
          message.message.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortBy === "newest" ? dateB - dateA : dateA - dateB;
      });
    }

    return result;
  }, [messages, searchQuery, sortBy]);

  // Load messages on mount
  useEffect(() => {
    fetchMessages(savedToken);
  }, [fetchMessages, savedToken]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchMessages(savedToken);
  }, [fetchMessages, savedToken]);

  return {
    messages,
    filteredMessages,
    loading,
    searchQuery,
    setSearchQuery,
    sortBy,
    toggleSort,
    clearFilters,
    refresh,
  };
};

// Hook for deleting messages
export const useDeleteMessage = () => {
  const { deleteMessage } = useMessageStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteMessage = async (id: string, token: string) => {
    setIsDeleting(true);
    const success = await deleteMessage(id, token);
    setIsDeleting(false);
    return success;
  };

  return {
    deleteMessage: handleDeleteMessage,
    isDeleting,
  };
};

// Hook for message date formatting
export const useMessageDateFormatters = () => {
  // Format date for display
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  return {
    formatDate,
  };
};
