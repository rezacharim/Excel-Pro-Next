"use client";

import { NextPage } from "next";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  ChangeEvent,
  DragEvent,
} from "react";
import Cookies from "js-cookie";
import {
  FaFilter,
  FaTrash,
  FaSearch,
  FaUpload,
  FaCheck,
  FaTimes,
  FaRedo,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import Modal from "@/components/atoms/Modal/Modal";
import { Button } from "@/components/atoms/Button/Button";
import Image from "next/image";
import {
  useGalleryList,
  useCreateGallery,
  useDeleteGallery,
  useGalleryFormatters,
} from "@/hooks/useGallery";
import { GalleryItem } from "@/stores/gallerystore";
import { titleFromFileName, uploadGalleryPhoto } from "./bulkUpload";

// Upload up to this many photos at the same time
const MAX_CONCURRENT_UPLOADS = 2;

type QueueStatus = "waiting" | "uploading" | "done" | "failed" | "canceled";

interface QueueEntry {
  id: string;
  file: File;
  title: string;
  previewUrl: string;
  status: QueueStatus;
}

interface ToastState {
  kind: "success" | "error";
  message: string;
}

const Gallery: NextPage = () => {
  // Use custom hooks for state management
  const token = Cookies.get("auth_token")!;
  // Ids currently being toggled, so a slow request cannot be double-clicked.
  const [homeSaving, setHomeSaving] = useState<Set<string>>(new Set());
  // Local overrides, so the star flips the moment it is clicked rather than
  // after a refetch.
  const [homeFlags, setHomeFlags] = useState<Record<string, boolean>>({});

  const isOnHome = (item: GalleryItem): boolean =>
    homeFlags[item.id] ?? Boolean(item.show_on_home);

  /**
   * Choose whether a photo appears in the home page slideshow. With none
   * chosen the front page falls back to the newest uploads, so this is opt-in
   * rather than something that has to be maintained.
   */
  const toggleShowOnHome = async (item: GalleryItem) => {
    const next = !isOnHome(item);
    setHomeFlags((f) => ({ ...f, [item.id]: next }));
    setHomeSaving((s) => new Set(s).add(item.id));
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/gallery/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ show_on_home: next }),
        }
      );
      if (!response.ok) throw new Error("Could not save");
    } catch {
      // Put the star back where it was; nothing was saved.
      setHomeFlags((f) => ({ ...f, [item.id]: !next }));
    } finally {
      setHomeSaving((s) => {
        const copy = new Set(s);
        copy.delete(item.id);
        return copy;
      });
    }
  };

  const {
    filteredItems,
    loading,
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
  } = useGalleryList();

  const {
    formData: createFormData,
    selectedFile,
    previewUrl,
    handleFileChange,
    handleInputChange: handleCreateInputChange,
    handleAddGalleryItem,
    resetForm: resetCreateForm,
  } = useCreateGallery();

  const { deleteGalleryItem } = useDeleteGallery();

  const { formatFileSize, getItemType } = useGalleryFormatters();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<GalleryItem | null>(null);

  // ---- Bulk upload state ----
  const [uploadQueue, setUploadQueue] = useState<QueueEntry[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<QueueEntry[]>([]);
  const activeCountRef = useRef(0);
  const batchTotalRef = useRef(0);
  const batchDoneRef = useRef(0);
  const batchFailedRef = useRef(0);
  const entryIdRef = useRef(0);
  const previewUrlsRef = useRef<string[]>([]);

  const showToast = useCallback((kind: "success" | "error", message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Revoke thumbnail object URLs when the screen unmounts
  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const setEntryStatus = useCallback((id: string, status: QueueStatus) => {
    setUploadQueue((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, status } : entry))
    );
  }, []);

  const finishBatchIfIdle = useCallback(() => {
    if (
      activeCountRef.current > 0 ||
      pendingRef.current.length > 0 ||
      batchTotalRef.current === 0
    ) {
      return;
    }

    const done = batchDoneRef.current;
    const failed = batchFailedRef.current;
    batchTotalRef.current = 0;
    batchDoneRef.current = 0;
    batchFailedRef.current = 0;

    if (done > 0) {
      refresh();
    }
    if (failed === 0 && done > 0) {
      showToast("success", `${done} photo${done === 1 ? "" : "s"} uploaded`);
    } else if (failed > 0) {
      showToast(
        "error",
        `${done} uploaded, ${failed} failed — use Retry next to a photo`
      );
    }
  }, [refresh, showToast]);

  const pumpQueue = useCallback(() => {
    while (
      activeCountRef.current < MAX_CONCURRENT_UPLOADS &&
      pendingRef.current.length > 0
    ) {
      const next = pendingRef.current.shift()!;
      activeCountRef.current += 1;
      setEntryStatus(next.id, "uploading");

      uploadGalleryPhoto(next.file, next.title, token)
        .then(() => {
          batchDoneRef.current += 1;
          setEntryStatus(next.id, "done");
        })
        .catch((error) => {
          console.error("Bulk upload failed:", error);
          batchFailedRef.current += 1;
          setEntryStatus(next.id, "failed");
        })
        .finally(() => {
          activeCountRef.current -= 1;
          pumpQueue();
        });
    }

    finishBatchIfIdle();
  }, [token, setEntryStatus, finishBatchIfIdle]);

  // Add dropped/selected files to the queue and start uploading
  const addFilesToQueue = useCallback(
    (files: FileList | File[]) => {
      const allFiles = Array.from(files);
      const imageFiles = allFiles.filter((file) =>
        file.type.startsWith("image/")
      );
      const skipped = allFiles.length - imageFiles.length;
      if (skipped > 0) {
        showToast(
          "error",
          `${skipped} file${skipped === 1 ? " was" : "s were"} skipped (photos only)`
        );
      }
      if (imageFiles.length === 0) return;

      const isIdle =
        activeCountRef.current === 0 && pendingRef.current.length === 0;

      const newEntries: QueueEntry[] = imageFiles.map((file) => {
        entryIdRef.current += 1;
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.push(previewUrl);
        return {
          id: `upload-${entryIdRef.current}`,
          file,
          title: titleFromFileName(file.name),
          previewUrl,
          status: "waiting" as const,
        };
      });

      setUploadQueue((prev) => {
        // Starting a fresh batch: drop entries that already finished
        const base = isIdle
          ? prev.filter((entry) => entry.status === "failed")
          : prev;
        return [...base, ...newEntries];
      });

      pendingRef.current.push(...newEntries);
      batchTotalRef.current += newEntries.length;
      pumpQueue();
    },
    [pumpQueue, showToast]
  );

  const handleBulkInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
    }
    // Allow picking the same files again later
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const cancelRemaining = () => {
    const canceledIds = new Set(pendingRef.current.map((entry) => entry.id));
    batchTotalRef.current -= pendingRef.current.length;
    pendingRef.current = [];
    setUploadQueue((prev) =>
      prev.map((entry) =>
        canceledIds.has(entry.id) ? { ...entry, status: "canceled" } : entry
      )
    );
    finishBatchIfIdle();
  };

  const retryEntry = (entry: QueueEntry) => {
    setEntryStatus(entry.id, "waiting");
    pendingRef.current.push(entry);
    batchTotalRef.current += 1;
    pumpQueue();
  };

  const clearQueueList = () => {
    setUploadQueue([]);
  };

  // Derived queue counts for the progress line
  const doneCount = uploadQueue.filter((e) => e.status === "done").length;
  const failedCount = uploadQueue.filter((e) => e.status === "failed").length;
  const uploadingCount = uploadQueue.filter(
    (e) => e.status === "uploading"
  ).length;
  const waitingCount = uploadQueue.filter((e) => e.status === "waiting").length;
  const isUploading = uploadingCount > 0 || waitingCount > 0;
  const activeTotal = doneCount + failedCount + uploadingCount + waitingCount;
  const currentPosition = Math.min(doneCount + failedCount + 1, activeTotal);

  // Open delete modal
  const openDeleteModal = (item: GalleryItem) => {
    setCurrentItem(item);
    setIsDeleteModalOpen(true);
  };

  // Add an item
  const onAddItem = async () => {
    const result = await handleAddGalleryItem(token);
    if (result) {
      setIsAddModalOpen(false);
      refresh(); // Refresh list
    }
  };

  // Delete an item
  const onDeleteItem = async () => {
    if (!currentItem) return;

    const success = await deleteGalleryItem(currentItem.id, token);
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
            Gallery
          </h1>
          <p className="text-gray-500">Manage your media files</p>
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
            <span>Add one photo with custom title</span>
          </Button>
        </div>
      </div>

      {/* Bulk Upload Zone */}
      <div className="mb-6">
        <div
          role="button"
          tabIndex={0}
          onClick={() => bulkInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              bulkInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragActive(false);
          }}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-[#E43125] bg-red-50"
              : "border-gray-300 bg-gray-50 hover:border-[#E43125] hover:bg-red-50"
          }`}
        >
          <FaUpload className="mx-auto text-3xl text-[#E43125] mb-3" />
          <p className="font-semibold text-gray-800">
            Drag photos here or click to choose — you can select many at once
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Photos are uploaded one by one. Large photos are shrunk
            automatically so uploads stay fast.
          </p>
          <input
            ref={bulkInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleBulkInputChange}
          />
        </div>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">
                {isUploading
                  ? `Uploading ${currentPosition} of ${activeTotal}…`
                  : failedCount > 0
                  ? `Finished — ${doneCount} uploaded, ${failedCount} failed`
                  : `Finished — ${doneCount} uploaded`}
              </p>
              <div className="flex items-center gap-3">
                {isUploading && waitingCount > 0 && (
                  <button
                    onClick={cancelRemaining}
                    className="text-sm text-[#E43125] font-medium hover:underline"
                  >
                    Cancel remaining
                  </button>
                )}
                {!isUploading && (
                  <button
                    onClick={clearQueueList}
                    className="text-sm text-gray-500 font-medium hover:underline"
                  >
                    Clear list
                  </button>
                )}
              </div>
            </div>
            <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {uploadQueue.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                    <Image
                      src={entry.previewUrl}
                      alt={entry.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {entry.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {entry.file.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {entry.status === "waiting" && (
                      <span className="text-xs text-gray-500">Waiting</span>
                    )}
                    {entry.status === "uploading" && (
                      <span className="text-xs text-gray-600 animate-pulse">
                        Uploading…
                      </span>
                    )}
                    {entry.status === "done" && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <FaCheck /> Done
                      </span>
                    )}
                    {entry.status === "failed" && (
                      <>
                        <span className="flex items-center gap-1 text-xs text-[#E43125] font-medium">
                          <FaTimes /> Failed
                        </span>
                        <button
                          onClick={() => retryEntry(entry)}
                          className="flex items-center gap-1 text-xs text-white bg-[#E43125] hover:bg-red-600 rounded px-2 py-1"
                        >
                          <FaRedo /> Retry
                        </button>
                      </>
                    )}
                    {entry.status === "canceled" && (
                      <>
                        <span className="text-xs text-gray-400">Canceled</span>
                        <button
                          onClick={() => retryEntry(entry)}
                          className="flex items-center gap-1 text-xs text-gray-600 border border-gray-300 hover:bg-gray-100 rounded px-2 py-1"
                        >
                          <FaRedo /> Upload
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
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
            placeholder="Search by title or caption"
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
          Loading gallery items...
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
                    alt={item.title}
                    fill
                  className="object-cover object-top rounded-md"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-4xl text-gray-400">
                      {item.mime_type.startsWith("video/") ? "🎬" : "📄"}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 truncate">
                  {item.title}
                </h3>
                {item.caption && (
                  <p className="text-gray-500 text-sm mb-2">{item.caption}</p>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{getItemType(item.mime_type)}</span>
                  <span>{formatFileSize(item.file_size)}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleShowOnHome(item)}
                    disabled={homeSaving.has(item.id)}
                    title={
                      isOnHome(item)
                        ? "Showing on the home page — click to remove"
                        : "Show this photo on the home page"
                    }
                    className={`flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors disabled:opacity-50 ${
                      isOnHome(item)
                        ? "text-[#E43125] font-medium"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {isOnHome(item) ? "★" : "☆"}
                    {isOnHome(item) ? "On home page" : "Show on home"}
                  </button>
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
          No gallery items found. Try adjusting your filters or upload a new
          file.
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Upload New File"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={createFormData.title}
              onChange={handleCreateInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter a title"
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
              File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
              <div className="flex flex-col items-center justify-center">
                {!selectedFile ? (
                  <>
                    <FaUpload className="text-gray-400 text-3xl mb-2" />
                    <p className="text-sm text-gray-500 mb-2">
                      Drag and drop a file here, or click to select
                    </p>
                  </>
                ) : (
                  <>
                    {previewUrl && selectedFile.type.startsWith("image/") ? (
                      <div className="mb-3">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          width={200}
                          height={150}
                          className="object-cover rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center mb-3 bg-gray-100 rounded-md w-full h-24">
                        <span className="text-3xl">
                          {selectedFile.type.startsWith("video/") ? "🎬" : "📄"}
                        </span>
                      </div>
                    )}
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <button
                      onClick={() => {
                        resetCreateForm();
                      }}
                      className="text-red-500 text-sm"
                    >
                      Remove
                    </button>
                  </>
                )}
                <input
                  type="file"
                  id="file-upload"
                  className={
                    selectedFile
                      ? "hidden"
                      : "absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  }
                  onChange={handleFileChange}
                />
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
              disabled={loading || !selectedFile || !createFormData.title}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "Uploading..." : "Upload"}
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
          <p>Are you sure you want to delete this item?</p>
          <p className="font-semibold">{currentItem?.title}</p>
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
            <h3 className="font-medium mb-2">Media Type</h3>
            <div className="space-y-2">
              {mediaTypes.map((type) => (
                <div key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`type-${type}`}
                    checked={filterType === type}
                    onChange={() => toggleFilter(type)}
                    className="mr-2"
                  />
                  <label htmlFor={`type-${type}`} className="capitalize">
                    {type}
                  </label>
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

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${
            toast.kind === "success" ? "bg-green-600" : "bg-[#E43125]"
          }`}
        >
          {toast.kind === "success" ? (
            <FaCheckCircle size={18} />
          ) : (
            <FaTimesCircle size={18} />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            <IoMdClose size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Gallery;