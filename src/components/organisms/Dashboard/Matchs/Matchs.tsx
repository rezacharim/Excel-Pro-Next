"use client";
import { NextPage } from "next";
import { useState } from "react";
import { FaFilter, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import Modal from "@/components/atoms/Modal/Modal";
import { Button } from "@/components/atoms/Button/Button";
import {
  useMatchList,
  useCreateMatch,
  useUpdateMatch,
  useDeleteMatch,
  useMatchDateFormatters,
} from "@/hooks/useMatch/Match";
import { Match } from "@/stores/matchStor/index";
import { AgeCategory } from "@/stores/matchStor/enums/enums";

const Matches: NextPage = () => {
  // Use custom hooks for state management
  const {
    filteredMatches,
    loading,
    searchQuery,
    setSearchQuery,
    filterType,
    sortBy,
    toggleFilter,
    toggleSort,
    clearFilters,
    matchTypes,
    refresh,
  } = useMatchList();

  const {
    formData: createFormData,
    handleInputChange: handleCreateInputChange,
    handleAddMatch,
    resetForm: resetCreateForm,
  } = useCreateMatch();

  const { deleteMatch } = useDeleteMatch();

  const { formatDate, formatDateForInput } = useMatchDateFormatters();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

  // Edit form state (using hook)
  const {
    formData: editFormData,
    handleInputChange: handleEditInputChange,
    handleUpdateMatch,
    setFormData: setEditFormData,
  } = useUpdateMatch();

  // Open edit modal
  const openEditModal = (match: Match) => {
    setCurrentMatch(match);
    setEditFormData({
      match_date: new Date(match.match_date),
      location: match.location,
      address: match.address,
      age_category: match.age_category,
      team1: match.team1,
      team2: match.team2,
      description: match.description,
    });
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (match: Match) => {
    setCurrentMatch(match);
    setIsDeleteModalOpen(true);
  };

  // Add a match
  const onAddMatch = async () => {
    const result = await handleAddMatch();
    if (result) {
      setIsAddModalOpen(false);
      refresh(); // Refresh list
    }
  };

  // Update a match
  const onUpdateMatch = async () => {
    if (!currentMatch) return;

    const result = await handleUpdateMatch(currentMatch.id);
    if (result) {
      setIsEditModalOpen(false);
      refresh(); // Refresh list
    }
  };

  // Delete a match
  const onDeleteMatch = async () => {
    if (!currentMatch) return;

    const success = await deleteMatch(currentMatch.id);
    if (success) {
      setIsDeleteModalOpen(false);
      await refresh();
      window.location.reload();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto bg-white rounded-lg">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Matches
          </h1>
          <p className="text-gray-500">Manage your matches</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              resetCreateForm();
              setIsAddModalOpen(true);
            }}
            className="rounded-md font-semibold flex items-center gap-2 text-sm md:text-base"
          >
            <span>+</span>
            <span>Add Match</span>
          </Button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => toggleSort("newest")}
            className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
              sortBy === "newest"
                ? "bg-gray-100"
                : "bg-white border border-gray-200"
            }`}
          >
            <span>Newest</span>
            {sortBy === "newest" && (
              <IoMdClose
                className="text-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSort("newest");
                }}
              />
            )}
          </button>
          <button
            onClick={() => toggleSort("oldest")}
            className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
              sortBy === "oldest"
                ? "bg-gray-100"
                : "bg-white border border-gray-200"
            }`}
          >
            <span>Oldest</span>
            {sortBy === "oldest" && (
              <IoMdClose
                className="text-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSort("oldest");
                }}
              />
            )}
          </button>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="px-3 py-2 rounded-md bg-white border border-gray-200 flex items-center gap-2 text-sm"
          >
            <FaFilter className="text-gray-500" />
            <span>More Filters</span>
          </button>
          {(sortBy || filterType) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-md text-blue-500 text-sm"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-md w-full md:w-64"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              <IoMdClose />
            </button>
          )}
        </div>
      </div>

      {/* Matches Table with Fixed Height and Scrolling */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
        <div className="hidden md:grid md:grid-cols-5 px-4 py-3 bg-white border-b border-gray-100 text-gray-600 font-medium sticky top-0 z-10">
          <div>Category</div>
          <div>Location</div>
          <div>Date</div>
          <div>Teams</div>
          <div></div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-gray-500">
              Loading matches...
            </div>
          ) : filteredMatches.length > 0 ? (
            filteredMatches.map((match: Match) => (
              <div
                key={match.id}
                className="grid grid-cols-1 md:grid-cols-5 px-4 py-4 items-center border-b border-gray-100 last:border-0"
              >
                {/* Mobile view - stacked layout */}
                <div className="md:hidden grid grid-cols-2 gap-2 mb-3">
                  <div className="font-medium">Category:</div>
                  <div>{match.age_category}</div>

                  <div className="font-medium">Location:</div>
                  <div>{match.location}</div>

                  <div className="font-medium">Date:</div>
                  <div>{formatDate(match.match_date)}</div>

                  <div className="font-medium">Teams:</div>
                  <div className="flex items-center gap-1">
                    <span>{match.team1}</span>
                    <span className="mx-1">vs</span>
                    <span>{match.team2}</span>
                  </div>

                  {match.description && (
                    <>
                      <div className="font-medium">Description:</div>
                      <div>{match.description}</div>
                    </>
                  )}
                </div>

                {/* Desktop view - row layout */}
                <div className="hidden md:block font-medium">
                  {match.age_category}
                </div>
                <div className="hidden md:block">{match.location}</div>
                <div className="hidden md:block">
                  {formatDate(match.match_date)}
                </div>
                <div className="hidden md:flex items-center gap-1">
                  <span>{match.team1}</span>
                  <span className="mx-1">VS</span>
                  <span>{match.team2}</span>
                </div>

                {/* Actions are the same in both views */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => openEditModal(match)}
                    className="p-2 text-gray-500 hover:text-blue-500 rounded-md"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => openDeleteModal(match)}
                    className="p-2 text-gray-500 hover:text-red-500 rounded-md"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-500">
              No matches found. Try adjusting your filters or search criteria.
            </div>
          )}
        </div>
      </div>

      {/* Add Match Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Match"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age Category
            </label>
            <select
              name="age_category"
              value={createFormData.age_category}
              onChange={handleCreateInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select category</option>
              {Object.values(AgeCategory).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name
            </label>
            <input
              type="text"
              name="location"
              value={createFormData.location}
              onChange={handleCreateInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Stadium or venue name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={createFormData.address}
              onChange={handleCreateInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Full address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date and Time
            </label>
            <input
              type="datetime-local"
              name="match_date"
              value={formatDateForInput(createFormData.match_date)}
              onChange={handleCreateInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team 1
              </label>
              <input
                type="text"
                name="team1"
                value={createFormData.team1}
                onChange={handleCreateInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Team name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team 2
              </label>
              <input
                type="text"
                name="team2"
                value={createFormData.team2}
                onChange={handleCreateInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Team name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              name="description"
              value={createFormData.description || ""}
              onChange={handleCreateInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Additional match details"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={onAddMatch}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Add Match
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Match Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Match"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age Category
            </label>
            <select
              name="age_category"
              value={editFormData.age_category}
              onChange={handleEditInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select category</option>
              {Object.values(AgeCategory).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name
            </label>
            <input
              type="text"
              name="location"
              value={editFormData.location}
              onChange={handleEditInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Stadium or venue name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={editFormData.address}
              onChange={handleEditInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Full address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date and Time
            </label>
            <input
              type="datetime-local"
              name="match_date"
              value={formatDateForInput(editFormData.match_date || new Date())}
              onChange={handleEditInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team 1
              </label>
              <input
                type="text"
                name="team1"
                value={editFormData.team1}
                onChange={handleEditInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Team name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team 2
              </label>
              <input
                type="text"
                name="team2"
                value={editFormData.team2}
                onChange={handleEditInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Team name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              name="description"
              value={editFormData.description || ""}
              onChange={handleEditInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Additional match details"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={onUpdateMatch}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this match?</p>
          <p className="font-semibold">
            {currentMatch?.team1} vs {currentMatch?.team2} (
            {currentMatch?.age_category})
          </p>
          <p className="text-sm text-gray-500">This action cannot be undone.</p>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={onDeleteMatch}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Matches"
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Age Category</h3>
            <div className="space-y-2">
              {matchTypes.map((type: AgeCategory) => (
                <div key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`type-${type}`}
                    checked={filterType === type}
                    onChange={() => toggleFilter(type)}
                    className="mr-2"
                  />
                  <label htmlFor={`type-${type}`}>{type}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Sort By</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="sort-newest"
                  checked={sortBy === "newest"}
                  onChange={() => toggleSort("newest")}
                  className="mr-2"
                />
                <label htmlFor="sort-newest">Newest</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="sort-oldest"
                  checked={sortBy === "oldest"}
                  onChange={() => toggleSort("oldest")}
                  className="mr-2"
                />
                <label htmlFor="sort-oldest">Oldest</label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Matches;