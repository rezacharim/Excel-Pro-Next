"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/atoms/Modal/Modal";
import { Button } from "@/components/atoms/Button/Button";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: string[];
  onApplyFilters: (filters: string[]) => void;
}

const FilterModal = ({ isOpen, onClose, activeFilters, onApplyFilters }: FilterModalProps) => {
  // Filter options by category
  const filterOptions = {
    sortBy: ["Newest", "Oldest", "A-Z", "Z-A"],
    gender: ["Male", "Female", "All"],
    status: ["verified", "pending", "rejected", "expired", "confirmed"],
    activePlan: ["U5-U8", "U9-U12", "U13-U14", "U15-U18", "All"]
  };

  // Selected filters in the modal (a copy of activeFilters)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  
  // Update selected filters when modal opens or active filters change
  useEffect(() => {
    if (isOpen) {
      setSelectedFilters([...activeFilters]);
    }
  }, [isOpen, activeFilters]);
  
  // Toggle a filter selection
  const toggleFilter = (filter: string) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter(f => f !== filter));
    } else {
      // If selecting a filter from a category that should be exclusive (e.g., sortBy)
      if (filterOptions.sortBy.includes(filter)) {
        // Remove any other sortBy filters
        const newFilters = selectedFilters.filter(f => !filterOptions.sortBy.includes(f));
        setSelectedFilters([...newFilters, filter]);
      } else if (filterOptions.gender.includes(filter)) {
        // If selecting "All" gender, remove other gender filters
        if (filter === "All") {
          const newFilters = selectedFilters.filter(f => !filterOptions.gender.includes(f));
          setSelectedFilters([...newFilters, filter]);
        } else {
          // If selecting a specific gender, remove "All" and any other gender
          const newFilters = selectedFilters.filter(f => !filterOptions.gender.includes(f));
          setSelectedFilters([...newFilters, filter]);
        }
      } else if (filterOptions.activePlan.includes(filter)) {
        // If selecting "All" plan, remove other plan filters
        if (filter === "All") {
          const newFilters = selectedFilters.filter(f => !filterOptions.activePlan.includes(f));
          setSelectedFilters([...newFilters, filter]);
        } else {
          // If selecting a specific plan, remove "All" and any other plan
          const newFilters = selectedFilters.filter(f => !filterOptions.activePlan.includes(f));
          setSelectedFilters([...newFilters, filter]);
        }
      } else {
        // For status, allow multiple selections
        setSelectedFilters([...selectedFilters, filter]);
      }
    }
  };
  
  // Apply the filters and close the modal
  const handleApplyFilters = () => {
    onApplyFilters(selectedFilters);
    onClose();
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setSelectedFilters([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filters">
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Sort By</h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.sortBy.map((option) => (
              <button
                key={option}
                onClick={() => toggleFilter(option)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  selectedFilters.includes(option)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Gender</h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.gender.map((option) => (
              <button
                key={option}
                onClick={() => toggleFilter(option)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  selectedFilters.includes(option)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Status</h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.status.map((option) => (
              <button
                key={option}
                onClick={() => toggleFilter(option)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  selectedFilters.includes(option)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Active Plan</h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.activePlan.map((option) => (
              <button
                key={option}
                onClick={() => toggleFilter(option)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  selectedFilters.includes(option)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between pt-4 border-t mt-4">
          <Button 
            onClick={handleResetFilters}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            Reset
          </Button>
          <Button 
            onClick={handleApplyFilters}
            className=" text-white rounded-lg"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FilterModal;