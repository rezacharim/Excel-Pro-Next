import { create } from "zustand";

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageState {
  messages: Message[];
  loading: boolean;
  error: string | null;

  // Fetch messages
  fetchMessages: (token: string) => Promise<void>;

  // Delete a message
  deleteMessage: (id: string, token: string) => Promise<boolean>;

  // Filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Sort state
  sortBy: "newest" | "oldest" | null;
  setSortBy: (sort: "newest" | "oldest" | null) => void;

  // Reset filters
  clearFilters: () => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  loading: false,
  error: null,

  // Search and filter
  searchQuery: "",
  sortBy: null,

  // Fetch all messages
  fetchMessages: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      set({ messages: data, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch messages",
        loading: false,
      });
    }
  },

  // Delete a message
  deleteMessage: async (id: string, token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      console.log(id)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Remove the message from the local state
      set((state) => ({
        messages: state.messages.filter((message) => message.id !== id),
        loading: false,
      }));
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete message",
        loading: false,
      });
      return false;
    }
  },

  // Set search query
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  // Set sort method
  setSortBy: (sort: "newest" | "oldest" | null) => set({ sortBy: sort }),

  // Clear all filters
  clearFilters: () => set({ searchQuery: "", sortBy: null }),
}));
