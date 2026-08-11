import { create } from "zustand";
import { AgeCategory } from "@/stores/matchStor/enums/enums";

// Types based on your NestJS backend Match entity
export interface Match {
  id: number;
  match_date: Date;
  description?: string;
  location: string;
  address: string;
  age_category: AgeCategory;
  team1: string;
  team2: string;
  createdAt: Date;
}

export interface CreateMatchDto {
  match_date: Date;
  description?: string;
  location: string;
  address: string;
  age_category: AgeCategory;
  team1: string;
  team2: string;
}

export interface UpdateMatchDto {
  match_date?: Date;
  description?: string;
  location?: string;
  address?: string;
  age_category?: AgeCategory;
  team1?: string;
  team2?: string;
}

export interface FilterMatchesParams {
  age_category?: AgeCategory;
  team1?: string;
  team2?: string;
  location?: string;
}

interface MatchStore {
  matches: Match[];
  currentMatch: Match | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchMatches: () => Promise<void>;
  fetchFilteredMatches: (params: FilterMatchesParams) => Promise<void>;
  fetchMatch: (id: number) => Promise<void>;
  createMatch: (
    match: CreateMatchDto,
    authToken: string
  ) => Promise<Match | null>;
  updateMatch: (
    id: number,
    match: UpdateMatchDto,
    authToken: string
  ) => Promise<Match | null>;
  removeMatch: (id: number, authToken: string) => Promise<boolean>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function for fetch calls with error handling
const fetchWithErrorHandling = async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Error: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as T;
};

export const useMatchStore = create<MatchStore>((set, get) => ({
  matches: [],
  currentMatch: null,
  loading: false,
  error: null,

  fetchMatches: async () => {
    try {
      set({ loading: true, error: null });

      // اضافه کردن headers برای جلوگیری از کش شدن نتایج
      const response = await fetch(`${API_URL}/matches`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched matches:", data.length);

      set({
        matches: data,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch matches",
        loading: false,
      });
    }
  },

  fetchFilteredMatches: async (params: FilterMatchesParams) => {
    try {
      set({ loading: true, error: null });

      // Build query string
      const queryParams = new URLSearchParams();
      if (params.age_category)
        queryParams.append("category", params.age_category);
      if (params.team1) queryParams.append("team1", params.team1);
      if (params.team2) queryParams.append("team2", params.team2);
      if (params.location) queryParams.append("location", params.location);

      const data = await fetchWithErrorHandling<Match[]>(
        `${API_URL}/matches/filter?${queryParams.toString()}`
      );
      set({ matches: data, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch filtered matches",
        loading: false,
      });
    }
  },

  fetchMatch: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const data = await fetchWithErrorHandling<Match>(
        `${API_URL}/matches/${id}`
      );
      set({ currentMatch: data, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : `Failed to fetch match with ID ${id}`,
        loading: false,
      });
    }
  },

  createMatch: async (match: CreateMatchDto, authToken: string) => {
    try {
      set({ loading: true, error: null });

      // Add auth token to request headers
      const data = await fetchWithErrorHandling<Match>(`${API_URL}/matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`, // Add auth token
        },
        body: JSON.stringify(match),
      });

      // Update the matches array with the new match
      const currentMatches = get().matches;
      set({
        matches: [...currentMatches, data],
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create match",
        loading: false,
      });
      return null;
    }
  },

  updateMatch: async (id: number, match: UpdateMatchDto, authToken: string) => {
    try {
      set({ loading: true, error: null });

      // Add auth token to request headers
      const data = await fetchWithErrorHandling<Match>(
        `${API_URL}/matches/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`, // Add auth token
          },
          body: JSON.stringify(match),
        }
      );

      // Update the matches array with the updated match
      const currentMatches = get().matches;
      const updatedMatches = currentMatches.map((m) =>
        m.id === id ? data : m
      );

      set({
        matches: updatedMatches,
        currentMatch: data,
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : `Failed to update match with ID ${id}`,
        loading: false,
      });
      return null;
    }
  },

  removeMatch: async (id: number, authToken: string) => {
    try {
      set({ loading: true, error: null });

      // فراخوانی API برای حذف مسابقه با ارسال توکن احراز هویت
      const response = await fetch(`${API_URL}/matches/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`, // Add auth token
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete match: ${response.status}`);
      }

      // بروزرسانی محلی استور
      const currentMatches = get().matches;
      set({
        matches: currentMatches.filter((match) => match.id !== id),
        currentMatch: null, // تنظیم صریح currentMatch به null
        loading: false,
      });

      // بازخوانی صریح داده‌ها از سرور
      try {
        const freshResponse = await fetch(`${API_URL}/matches`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (freshResponse.ok) {
          const freshData = await freshResponse.json();
          set({ matches: freshData });
        }
      } catch (fetchError) {
        console.error("Error refreshing data after deletion:", fetchError);
      }

      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : `Failed to remove match with ID ${id}`,
        loading: false,
      });
      return false;
    }
  },
}));
