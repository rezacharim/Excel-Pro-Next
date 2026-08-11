import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  useMatchStore,
  Match,
  CreateMatchDto,
  UpdateMatchDto,
} from "@/stores/matchStor/index";
import { AgeCategory } from "@/stores/matchStor/enums/enums";

// Hook to get and filter all matches
export const useMatchList = () => {
  const { matches, loading, error, fetchMatches } = useMatchStore();

  // Local state for filtering and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | null>("newest");
  const [filterActive, setFilterActive] = useState(false);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);

  // Get the matches on component mount
  useEffect(() => {
    console.log("Fetching matches...");
    fetchMatches();
  }, [fetchMatches]);

  // Apply filters and search
  useEffect(() => {
    console.log("Filtering matches...", matches.length);
    if (!matches.length) return;

    let result = [...matches];

    // Apply search
    if (searchQuery) {
      result = result.filter(
        (match) =>
          match.age_category
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          match.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.team1.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.team2.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (match.description &&
            match.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply type filter
    if (filterType) {
      result = result.filter((match) => match.age_category === filterType);
    }

    // Apply sorting (now using actual Date objects)
    if (sortBy === "newest") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
      );
    } else if (sortBy === "oldest") {
      result = [...result].sort(
        (a, b) =>
          new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
      );
    }

    setFilteredMatches(result);
  }, [matches, searchQuery, filterType, sortBy]);

  // Toggle filter type
  const toggleFilter = (type: string) => {
    if (filterType === type) {
      setFilterType(null);
    } else {
      setFilterType(type);
    }
    setFilterActive(filterType !== type);
  };

  // Toggle sort
  const toggleSort = (sort: "newest" | "oldest") => {
    if (sortBy === sort) {
      setSortBy(null);
    } else {
      setSortBy(sort);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterType(null);
    setSortBy(null);
    setFilterActive(false);
  };

  // Get unique match types for filter options
  const matchTypes = Array.from(
    new Set(matches.map((match) => match.age_category))
  );

  return {
    matches,
    filteredMatches,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterType,
    sortBy,
    filterActive,
    toggleFilter,
    toggleSort,
    clearFilters,
    matchTypes,
    refresh: fetchMatches,
  };
};

// Hook for creating a match
export const useCreateMatch = () => {
  const { createMatch, loading, error } = useMatchStore();

  // Initial form state
  const defaultFormData: CreateMatchDto = {
    match_date: new Date(),
    location: "",
    address: "",
    age_category: AgeCategory.U5_U8,
    team1: "",
    team2: "",
    description: "",
  };

  // Form state
  const [formData, setFormData] = useState<CreateMatchDto>(defaultFormData);

  // Reset form
  const resetForm = () => {
    setFormData(defaultFormData);
  };

  // Handle form submission
  const handleAddMatch = async () => {
    const auth_token = Cookies.get("auth_token");
    console.log("Creating match:", formData);
    const result = await createMatch(formData, auth_token!);
    if (result) {
      resetForm();
    }
    return result;
  };

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle date field
    if (name === "match_date") {
      setFormData({
        ...formData,
        match_date: new Date(value),
      });
    }
    // Handle age category field
    else if (name === "age_category") {
      setFormData({
        ...formData,
        age_category: value as AgeCategory,
      });
    }
    // Handle other fields
    else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  return {
    formData,
    setFormData,
    loading,
    error,
    handleAddMatch,
    handleInputChange,
    resetForm,
  };
};

// Hook for updating a match
export const useUpdateMatch = (id?: number) => {
  const { fetchMatch, updateMatch, currentMatch, loading, error } =
    useMatchStore();

  // Form state
  const [formData, setFormData] = useState<UpdateMatchDto>({});

  // Load match data when id changes
  useEffect(() => {
    if (id) {
      fetchMatch(id);
    }
  }, [fetchMatch, id]);

  // Update form data when current match changes
  useEffect(() => {
    if (currentMatch) {
      setFormData({
        match_date: new Date(currentMatch.match_date),
        location: currentMatch.location,
        address: currentMatch.address,
        age_category: currentMatch.age_category,
        team1: currentMatch.team1,
        team2: currentMatch.team2,
        description: currentMatch.description,
      });
    }
  }, [currentMatch]);

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle date field
    if (name === "match_date") {
      setFormData({
        ...formData,
        match_date: new Date(value),
      });
    }
    // Handle age category field
    else if (name === "age_category") {
      setFormData({
        ...formData,
        age_category: value as AgeCategory,
      });
    }
    // Handle other fields
    else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleUpdateMatch = async (matchId: number) => {
    const auth_token = Cookies.get("auth_token");
    console.log("Updating match:", matchId, formData);
    const result = await updateMatch(matchId, formData, auth_token!);
    return result;
  };

  return {
    match: currentMatch,
    formData,
    loading,
    error,
    handleUpdateMatch,
    handleInputChange,
    setFormData,
  };
};

// Hook for deleting a match
export const useDeleteMatch = () => {
  const { removeMatch, fetchMatches, loading, error } = useMatchStore();

  const deleteMatch = async (id: number) => {
    console.log("Deleting match with ID:", id);
    try {
      const matchId = typeof id === "string" ? parseInt(id, 10) : id;

      if (isNaN(matchId)) {
        console.error("Invalid match ID for deletion:", id);
        return false;
      }
      const auth_token = Cookies.get("auth_token");
      const success = await removeMatch(matchId, auth_token!);

      if (success) {
        // اگر حذف موفقیت‌آمیز بود، صریحاً لیست را دوباره بارگیری کنید
        await fetchMatches();
      }

      console.log("Delete result:", success);
      return success;
    } catch (err) {
      console.error("Error deleting match:", err);
      return false;
    }
  };

  return {
    deleteMatch,
    loading,
    error,
  };
};

// Utility function to format dates
export const useMatchDateFormatters = () => {
  // Format date for display - YYYY/M/D h:mm AM/PM format
  const formatDate = (date: Date | string): string => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      // Format the date part as YYYY/M/D
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1; // getMonth() returns 0-11
      const day = dateObj.getDate();

      // Format the time part as h:mm AM/PM
      let hours = dateObj.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'

      // Add leading zero to minutes if needed
      const minutes = dateObj.getMinutes().toString().padStart(2, "0");

      return `${year}/${month}/${day} ${hours}:${minutes} ${ampm}`;
    } catch (err) {
      console.error("Error formatting date:", err);
      return "Invalid date";
    }
  };

  // Convert datetime-local input value to ISO string format for input element
  const formatDateForInput = (date: Date | string): string => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    } catch (err) {
      console.error("Error formatting date for input:", err);
      return new Date().toISOString().slice(0, 16);
    }
  };

  return {
    formatDate,
    formatDateForInput,
  };
};
