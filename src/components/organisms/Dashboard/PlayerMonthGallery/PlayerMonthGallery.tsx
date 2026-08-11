"use client";

import { NextPage } from "next";
import { useState } from "react";
import Cookies from "js-cookie";
import { FaTrash, FaSearch, FaUpload, FaEdit } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import Modal from "@/components/atoms/Modal/Modal";
import { Button } from "@/components/atoms/Button/Button";
import Image from "next/image";
import {
  usePlayerMonthList,
  useCreatePlayerMonth,
  useUpdatePlayerMonth,
  useDeletePlayerMonth,
  usePlayerMonthFormatters,
} from "@/hooks/usePlayerMonth";
import { PlayerMonthItem } from "@/stores/playerMonthStore";

const PlayerMonthGallery: NextPage = () => {
  // Use custom hooks for state management
  const token = Cookies.get("auth_token")!;

  const {
    filteredItems,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    toggleSort,
    clearFilters,
    refresh,
  } = usePlayerMonthList();

  const {
    formData: createFormData,
    selectedFile,
    previewUrl,
    handleFileChange,
    handleInputChange: handleCreateInputChange,
    handleAddPlayerMonthItem,
    resetForm: resetCreateForm,
  } = useCreatePlayerMonth();

  const {
    formData: updateFormData,
    handleInputChange: handleUpdateInputChange,
    handleUpdatePlayerMonthItem,
    setInitialFormData,
  } = useUpdatePlayerMonth();

  const { deletePlayerMonthItem } = useDeletePlayerMonth();

  const { formatFileSize, formatDate } = usePlayerMonthFormatters();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<PlayerMonthItem | null>(null);

  // Open edit modal
  const openEditModal = (item: PlayerMonthItem) => {
    setCurrentItem(item);
    setInitialFormData(item);
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (item: PlayerMonthItem) => {
    setCurrentItem(item);
    setIsDeleteModalOpen(true);
  };

  // Add an item
  const onAddItem = async () => {
    const result = await handleAddPlayerMonthItem(token);
    if (result) {
      setIsAddModalOpen(false);
      refresh(); // Refresh list
    }
  };

  // Update an item
  const onUpdateItem = async () => {
    if (!currentItem) return;

    const success = await handleUpdatePlayerMonthItem(currentItem.id, token);
    if (success) {
      setIsEditModalOpen(false);
      refresh(); // Refresh list
    }
  };

  // Delete an item
  const onDeleteItem = async () => {
    if (!currentItem) return;

    const success = await deletePlayerMonthItem(currentItem.id, token);
    if (success) {
      setIsDeleteModalOpen(false);
      refresh(); // Refresh list
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto bg-white rounded-lg">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Player of the Month
          </h1>
          <p className="text-gray-500">Manage player of the month images</p>
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
            <span>Add Player</span>
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
          {sortBy && (
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
            placeholder="Search by player name or caption"
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

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Gallery Grid */}
      {loading && !filteredItems.length ? (
        <div className="py-8 text-center text-gray-500">
          Loading player of the month items...
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="relative h-64 bg-gray-100">
                {item.mime_type.startsWith("image/") ? (
                  <Image
                    src={`${item.image_url}`}
                    alt={item.player_name}
                    fill
                    className="object-cover object-top rounded-md"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-4xl text-gray-400">📄</div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 truncate">
                  {item.player_name}
                </h3>
                {item.caption && (
                  <p className="text-gray-500 text-sm mb-2">{item.caption}</p>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Uploaded: {formatDate(item.created_at)}</span>
                  <span>{formatFileSize(item.file_size)}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center gap-4">
                  <Button
                    onClick={() => openEditModal(item)}
                    className="flex items-center gap-1 text-sm rounded-lg"
                  >
                    <FaEdit /> Edit
                  </Button>
                  <button
                    onClick={() => openDeleteModal(item)}
                    className="text-red-500 flex items-center gap-1 text-sm"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          No player of the month items found. Try adjusting your filters or add
          a new player.
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Player of the Month"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Name
            </label>
            <input
              type="text"
              name="player_name"
              value={createFormData.player_name}
              onChange={handleCreateInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter player name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption (optional)
            </label>
            <textarea
              name="caption"
              value={createFormData.caption}
              onChange={handleCreateInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Enter a caption"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 relative">
              <div className="flex flex-col items-center justify-center">
                {!selectedFile ? (
                  <>
                    <FaUpload className="text-gray-400 text-3xl mb-2" />
                    <p className="text-sm text-gray-500 mb-2">
                      Drag and drop an image here, or click to select
                    </p>
                    <input
                      type="file"
                      id="file-upload"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </>
                ) : (
                  <>
                    {previewUrl && (
                      <div className="mb-3">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          width={200}
                          height={150}
                          className="object-cover rounded-md"
                        />
                      </div>
                    )}
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <button
                      onClick={resetCreateForm}
                      className="text-red-500 text-sm"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={onAddItem}
              disabled={loading || !selectedFile || !createFormData.player_name}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Player of the Month"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Name
            </label>
            <input
              type="text"
              name="player_name"
              value={updateFormData.player_name}
              onChange={handleUpdateInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter player name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption (optional)
            </label>
            <textarea
              name="caption"
              value={updateFormData.caption}
              onChange={handleUpdateInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Enter a caption"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-lg text-white"
            >
              Cancel
            </Button>
            <button
              onClick={onUpdateItem}
              disabled={loading || !updateFormData.player_name}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this player of the month?</p>
          <p className="font-semibold">{currentItem?.player_name}</p>
          <p className="text-sm text-gray-500">This action cannot be undone.</p>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={onDeleteItem}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Items"
      >
        <div className="space-y-4">
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

export default PlayerMonthGallery;