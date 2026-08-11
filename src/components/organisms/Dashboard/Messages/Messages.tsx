"use client";
import { NextPage } from "next";
import { useState } from "react";
import Cookies from "js-cookie";
import { FaFilter, FaTrash, FaSearch, FaEye } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import Modal from "@/components/atoms/Modal/Modal";
import {
  useMessageList,
  useDeleteMessage,
  useMessageDateFormatters,
} from "@/hooks/useMessage/index";
import { Message } from "@/stores/messageStore";

const Messages: NextPage = () => {


  const savedToken = Cookies.get("auth_token")!;

  // Use custom hooks for state management
  const {
    filteredMessages,
    loading,
    searchQuery,
    setSearchQuery,
    sortBy,
    toggleSort,
    clearFilters,
    refresh,
  } = useMessageList();

  const { deleteMessage } = useDeleteMessage();
  const { formatDate } = useMessageDateFormatters();

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);

  // Open view modal
  const openViewModal = (message: Message) => {
    setCurrentMessage(message);
    setIsViewModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (message: Message) => {
    setCurrentMessage(message);
    setIsDeleteModalOpen(true);
  };

  // Delete a message
  const onDeleteMessage = async () => {
    if (!currentMessage) return;

    const success = await deleteMessage(currentMessage.id, savedToken);
    if (success) {
      setIsDeleteModalOpen(false);
      refresh();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto bg-white rounded-lg">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Messages
          </h1>
          <p className="text-gray-500">Manage your incoming messages</p>
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

      {/* Messages Table with Fixed Height and Scrolling */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
        <div className="hidden md:grid md:grid-cols-5 px-4 py-3 bg-white border-b border-gray-100 text-gray-600 font-medium sticky top-0 z-10">
          <div>Sender</div>
          <div>Email</div>
          <div>Subject</div>
          <div>Date</div>
          <div></div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-gray-500">
              Loading messages...
            </div>
          ) : filteredMessages.length > 0 ? (
            filteredMessages.map((message: Message) => (
              <div
                key={message.id}
                className="grid grid-cols-1 md:grid-cols-5 px-4 py-4 items-center border-b border-gray-100 last:border-0"
              >
                {/* Mobile view - stacked layout */}
                <div className="md:hidden grid grid-cols-2 gap-2 mb-3">
                  <div className="font-medium">Sender:</div>
                  <div>{message.name}</div>

                  <div className="font-medium">Email:</div>
                  <div className="truncate">{message.email}</div>

                  <div className="font-medium">Subject:</div>
                  <div>{message.subject}</div>

                  <div className="font-medium">Date:</div>
                  <div>{formatDate(message.createdAt)}</div>
                </div>

                {/* Desktop view - row layout */}
                <div className="hidden md:block">{message.name}</div>
                <div className="hidden md:block truncate">{message.email}</div>
                <div className="hidden md:block truncate">{message.subject}</div>
                <div className="hidden md:block">
                  {formatDate(message.createdAt)}
                </div>

                {/* Actions are the same in both views */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => openViewModal(message)}
                    className="p-2 text-gray-500 hover:text-blue-500 rounded-md"
                    title="View message"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => openDeleteModal(message)}
                    className="p-2 text-gray-500 hover:text-red-500 rounded-md"
                    title="Delete message"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-500">
              No messages found. Try adjusting your search filters.
            </div>
          )}
        </div>
      </div>

      {/* View Message Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="View Message"
      >
        {currentMessage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Sender:</div>
              <div>{currentMessage.name}</div>

              <div className="font-medium">Email:</div>
              <div>{currentMessage.email}</div>

              <div className="font-medium">Subject:</div>
              <div>{currentMessage.subject}</div>

              <div className="font-medium">Received Date:</div>
              <div>{formatDate(currentMessage.createdAt)}</div>
            </div>

            <div>
              <div className="font-medium mb-2">Message Content:</div>
              <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                {currentMessage.message}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openDeleteModal(currentMessage);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete Message
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this message?</p>
          <p className="font-semibold">
            From: {currentMessage?.name} - Subject: {currentMessage?.subject}
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
              onClick={onDeleteMessage}
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
        title="Filter Messages"
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

export default Messages;