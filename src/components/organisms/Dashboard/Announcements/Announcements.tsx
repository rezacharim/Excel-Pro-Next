"use client";

import { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  CheckCircle2,
  Loader2,
  Megaphone,
  Pencil,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Upload,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import {
  compressImage,
  formatBytes,
  MAX_UPLOAD_BYTES,
} from "@/utils/compressImage";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AnnouncementCategory =
  | "league"
  | "trial"
  | "news"
  | "match"
  | "medal"
  | "interview";

interface PostPhoto {
  url: string;
  caption?: string;
}

interface Announcement {
  id: number;
  title: string;
  slug: string | null;
  body: string;
  category: AnnouncementCategory;
  fullBody: string | null;
  photos: PostPhoto[] | null;
  eventDate: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

/** An image already in the Gallery, reusable across announcements. */
interface GalleryImage {
  id: string;
  title: string;
  image_url: string;
}

interface AnnouncementFormState {
  title: string;
  category: AnnouncementCategory;
  body: string;
  fullBody: string;
  photos: PostPhoto[];
  eventDate: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
  isActive: boolean;
}

interface ToastState {
  kind: "success" | "error";
  message: string;
}

type ModalState =
  | { type: "create" }
  | { type: "edit"; announcement: Announcement }
  | { type: "delete"; announcement: Announcement };

const CATEGORY_OPTIONS: { value: AnnouncementCategory; label: string }[] = [
  { value: "league", label: "League Registration" },
  { value: "trial", label: "Trials" },
  { value: "news", label: "News" },
  { value: "match", label: "Match Report" },
  { value: "medal", label: "Awards & Medals" },
  { value: "interview", label: "Interview" },
];

const CATEGORY_BADGES: Record<
  AnnouncementCategory,
  { label: string; className: string }
> = {
  league: { label: "League Registration", className: "bg-[#E43125] text-white" },
  trial: { label: "Trials", className: "bg-[#020022] text-white" },
  news: { label: "News", className: "bg-gray-200 text-gray-700" },
  match: { label: "Match Report", className: "bg-[#020022] text-white" },
  medal: { label: "Awards", className: "bg-amber-500 text-white" },
  interview: { label: "Interview", className: "bg-emerald-600 text-white" },
};

const EMPTY_FORM: AnnouncementFormState = {
  title: "",
  category: "news",
  body: "",
  fullBody: "",
  photos: [],
  eventDate: "",
  ctaLabel: "",
  ctaUrl: "",
  imageUrl: "",
  isActive: true,
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Announcements: NextPage = () => {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<AnnouncementFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  // The same picker fills the header photo and the post's gallery, so it has
  // to remember which one opened it.
  const [pickerTarget, setPickerTarget] = useState<"main" | "post">("main");
  const [isUploading, setIsUploading] = useState(false);

  const savedToken = Cookies.get("auth_token");

  const showToast = useCallback((kind: "success" | "error", message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await fetch(`${API_URL}/announcements/all`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }
      const data: Announcement[] = await response.json();
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRows(sorted);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setLoadError("Failed to load announcements. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [savedToken]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const closeModal = () => {
    if (isSubmitting) return;
    setModal(null);
  };

  /** The Gallery is the same one under Dashboard > Gallery. */
  const fetchGallery = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/gallery`);
      if (!response.ok) return;
      const data = await response.json();
      setGallery(Array.isArray(data) ? data : []);
    } catch {
      // A picker that cannot load is not worth an error banner; the admin can
      // still upload a new photo.
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  /**
   * Uploading puts the photo in the Gallery and selects it here, so a picture
   * used for an announcement is reusable rather than stranded.
   */
  const handlePhotoUpload = async (rawFile: File) => {
    if (!rawFile.type.startsWith("image/")) {
      showToast("error", "That file is not an image.");
      return;
    }
    setIsUploading(true);
    try {
      // Same limit as everywhere else: Vercel drops request bodies over 4.5MB
      // before the server sees them, surfacing as an unexplained
      // "Failed to fetch". Shrink the photo rather than let that happen.
      const file = await compressImage(rawFile);
      if (file.size > MAX_UPLOAD_BYTES) {
        showToast(
          "error",
          `That photo is ${formatBytes(file.size)} and still too large after ` +
            `resizing. Please save it as a JPEG and try again.`
        );
        setIsUploading(false);
        return;
      }
      const body = new FormData();
      body.append("file", file);
      body.append("title", file.name.replace(/\.[^.]+$/, ""));
      const response = await fetch(`${API_URL}/gallery`, {
        method: "POST",
        headers: { Authorization: `Bearer ${savedToken}` },
        body,
      });
      if (!response.ok) {
        // Show what the server actually said. "Upload failed" hid the one
        // piece of information that makes the problem fixable — whether it
        // was the size, the file type, or storage itself.
        let detail = "";
        try {
          const problem = await response.json();
          detail = problem?.message || problem?.error || "";
        } catch {
          detail = "";
        }
        throw new Error(
          detail || `Upload failed (server returned ${response.status})`
        );
      }
      const created = await response.json();
      const url = created?.image_url || created?.data?.image_url;
      if (!url) throw new Error("Upload did not return an image URL");
      setForm((f) =>
        pickerTarget === "main"
          ? { ...f, imageUrl: url }
          : { ...f, photos: [...f.photos, { url }] }
      );
      setGalleryOpen(false);
      fetchGallery();
      showToast("success", "Photo uploaded and selected");
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      showToast(
        "error",
        /failed to fetch|networkerror|load failed/i.test(raw)
          ? "The photo could not be sent — it is probably too large. Try a smaller file."
          : raw || "Could not upload the photo"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setModal({ type: "create" });
  };

  const openEditModal = (announcement: Announcement) => {
    setForm({
      title: announcement.title,
      category: announcement.category,
      body: announcement.body,
      fullBody: announcement.fullBody || "",
      photos: Array.isArray(announcement.photos) ? announcement.photos : [],
      eventDate: announcement.eventDate || "",
      ctaLabel: announcement.ctaLabel || "",
      ctaUrl: announcement.ctaUrl || "",
      imageUrl: announcement.imageUrl || "",
      isActive: announcement.isActive,
    });
    setModal({ type: "edit", announcement });
  };

  const handleSave = async () => {
    if (!modal || (modal.type !== "create" && modal.type !== "edit")) return;

    if (!form.title.trim()) {
      showToast("error", "Please enter a title");
      return;
    }
    if (!form.body.trim()) {
      showToast("error", "Please enter the announcement text");
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      body: form.body.trim(),
      fullBody: form.fullBody.trim(),
      photos: form.photos
        .filter((p) => p.url)
        .map((p) => ({
          url: p.url,
          ...(p.caption?.trim() ? { caption: p.caption.trim() } : {}),
        })),
      eventDate: form.eventDate || null,
      ctaLabel: form.ctaLabel.trim() || null,
      ctaUrl: form.ctaUrl.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      isActive: form.isActive,
    };

    const isCreate = modal.type === "create";
    const url = isCreate
      ? `${API_URL}/announcements`
      : `${API_URL}/announcements/${modal.announcement.id}`;

    try {
      setIsSubmitting(true);
      const response = await fetch(url, {
        method: isCreate ? "POST" : "PATCH",
        headers: {
          Authorization: `Bearer ${savedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let message = "Request failed";
        try {
          const errorData = await response.json();
          message = Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message || message;
        } catch {
          // keep generic message
        }
        throw new Error(message);
      }
      setModal(null);
      showToast(
        "success",
        isCreate ? "Announcement created" : "Announcement updated"
      );
      await fetchAnnouncements();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!modal || modal.type !== "delete") return;
    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${API_URL}/announcements/${modal.announcement.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete announcement");
      }
      setModal(null);
      showToast("success", "Announcement deleted");
      await fetchAnnouncements();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryBadge = (category: AnnouncementCategory) => {
    const badge = CATEGORY_BADGES[category] ?? CATEGORY_BADGES.news;
    return (
      <span
        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}
      >
        {badge.label}
      </span>
    );
  };

  const isFormModal =
    modal && (modal.type === "create" || modal.type === "edit");

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen rounded-lg">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Announcements</h1>
          <p className="text-gray-500 text-sm md:text-base">
            Post news, trial dates and league registration updates to the
            website
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New announcement
        </button>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading announcements...</span>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <XCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-gray-700 mb-4">{loadError}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                fetchAnnouncements();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] text-sm"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500">
            <Megaphone className="w-10 h-10 text-gray-300 mb-3" />
            <p>No announcements yet. Create your first one.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                      Announcement
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                      Category
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                      Date
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6">
                        <div className="font-medium text-sm md:text-base">
                          {row.title}
                        </div>
                        <div className="text-gray-500 text-xs md:text-sm line-clamp-1 max-w-md">
                          {row.body}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {renderCategoryBadge(row.category)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {row.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                            <X size={12} />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(row)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                            aria-label={`Edit ${row.title}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() =>
                              setModal({ type: "delete", announcement: row })
                            }
                            className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                            aria-label={`Delete ${row.title}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 md:p-4 border-t border-gray-200 text-gray-500 text-xs md:text-sm">
              {rows.length} announcement{rows.length === 1 ? "" : "s"}
            </div>
          </>
        )}
      </div>

      {/* Create / edit modal */}
      {isFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-5 md:p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold mb-4">
              {modal.type === "create"
                ? "New announcement"
                : "Edit announcement"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Summer league registration is open"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category: e.target.value as AnnouncementCategory,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, body: e.target.value }))
                  }
                  rows={5}
                  placeholder="Announcement details (line breaks are kept on the website)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA label (optional)
                  </label>
                  <input
                    type="text"
                    value={form.ctaLabel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ctaLabel: e.target.value }))
                    }
                    placeholder="e.g. Register now"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA URL (optional)
                  </label>
                  <input
                    type="text"
                    value={form.ctaUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ctaUrl: e.target.value }))
                    }
                    placeholder="/program or https://..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              {/* ---- photo ---------------------------------------- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo (optional)
                </label>

                {form.imageUrl ? (
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.imageUrl}
                      alt="Selected"
                      className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setGalleryOpen(true)}
                        className="text-sm font-medium text-primary hover:underline text-left"
                      >
                        Change photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                        className="text-sm text-gray-500 hover:underline text-left"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget("main");
                        setGalleryOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      <ImageIcon size={16} />
                      Choose from gallery
                    </button>
                    <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer">
                      {isUploading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      {isUploading ? "Uploading…" : "Upload a new photo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <span className="text-xs text-gray-500">
                      Leave empty to use the default photo for this category.
                    </span>
                  </div>
                )}

                {galleryOpen && (
                  <div className="mt-3 border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        {pickerTarget === "main"
                          ? "Pick the header photo"
                          : "Click photos to add them to the post — pick several"}
                      </p>
                      <button
                        type="button"
                        onClick={() => setGalleryOpen(false)}
                        className="text-sm text-gray-500 hover:underline"
                      >
                        Close
                      </button>
                    </div>
                    {gallery.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">
                        No photos in the gallery yet. Upload one instead.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {gallery.map((image) => (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => {
                              if (pickerTarget === "main") {
                                setForm((f) => ({
                                  ...f,
                                  imageUrl: image.image_url,
                                }));
                                setGalleryOpen(false);
                                return;
                              }
                              // Multi-select: clicking an already-added photo
                              // takes it out again, and the picker stays open
                              // so a whole medal day can go in at once.
                              setForm((f) => ({
                                ...f,
                                photos: f.photos.some(
                                  (p) => p.url === image.image_url
                                )
                                  ? f.photos.filter(
                                      (p) => p.url !== image.image_url
                                    )
                                  : [...f.photos, { url: image.image_url }],
                              }));
                            }}
                            className={`relative aspect-video rounded-md overflow-hidden border-2 hover:ring-2 hover:ring-primary ${
                              (
                                pickerTarget === "main"
                                  ? form.imageUrl === image.image_url
                                  : form.photos.some(
                                      (p) => p.url === image.image_url
                                    )
                              )
                                ? "border-[#E43125]"
                                : "border-gray-200"
                            }`}
                            title={image.title}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.image_url}
                              alt={image.title}
                              className="w-full h-full object-cover"
                            />
                            {pickerTarget === "post" &&
                              form.photos.some(
                                (p) => p.url === image.image_url
                              ) && (
                                <span className="absolute top-1 right-1 bg-[#E43125] text-white rounded-full p-0.5">
                                  <CheckCircle2 size={14} />
                                </span>
                              )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Full post — the story and photo gallery on its own page */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-[#020022]">
                  Full post page
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">
                  Fill this in for a match report, a medal day or an interview.
                  The card above gets a &ldquo;Read the full story&rdquo; link
                  to a page of its own. Leave it empty for a short notice and
                  nothing changes.
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date it happened
                </label>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) =>
                    setForm({ ...form, eventDate: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  The day of the match or the presentation. Shown instead of
                  the day you posted it. Leave blank if they are the same.
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  The full story
                </label>
                <textarea
                  value={form.fullBody}
                  onChange={(e) =>
                    setForm({ ...form, fullBody: e.target.value })
                  }
                  rows={10}
                  placeholder={
                    "How the game went, who scored, what the coaches said.\n\nLeave a blank line between paragraphs.\n\n## Use two hashes for a heading\n- Use a dash for a bullet point"
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  A blank line starts a new paragraph. ## makes a heading and -
                  makes a bullet.
                </p>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Photos{form.photos.length ? ` (${form.photos.length})` : ""}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPickerTarget("post");
                          setGalleryOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50"
                      >
                        <ImageIcon size={14} />
                        Add from gallery
                      </button>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                        {isUploading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploading}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setPickerTarget("post");
                            if (file) handlePhotoUpload(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {form.photos.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-lg">
                      No photos yet. A medal day or a match can have as many as
                      you like.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {form.photos.map((photo, index) => (
                        <div
                          key={`${photo.url}-${index}`}
                          className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg"
                        >
                          <div className="w-14 h-14 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <input
                            value={photo.caption ?? ""}
                            onChange={(e) => {
                              const next = [...form.photos];
                              next[index] = {
                                ...next[index],
                                caption: e.target.value,
                              };
                              setForm({ ...form, photos: next });
                            }}
                            placeholder="Caption (optional) — e.g. U13 receiving their medals"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm"
                          />
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              title="Move up"
                              disabled={index === 0}
                              onClick={() => {
                                const next = [...form.photos];
                                [next[index - 1], next[index]] = [
                                  next[index],
                                  next[index - 1],
                                ];
                                setForm({ ...form, photos: next });
                              }}
                              className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              title="Move down"
                              disabled={index === form.photos.length - 1}
                              onClick={() => {
                                const next = [...form.photos];
                                [next[index], next[index + 1]] = [
                                  next[index + 1],
                                  next[index],
                                ];
                                setForm({ ...form, photos: next });
                              }}
                              className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              title="Remove"
                              onClick={() =>
                                setForm({
                                  ...form,
                                  photos: form.photos.filter(
                                    (_, i) => i !== index
                                  ),
                                })
                              }
                              className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-[#E43125]"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#E43125]"
                />
                Active (visible on the website)
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60 bg-[#E43125] hover:bg-[#c9281e]"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                {modal.type === "create" ? "Create" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {modal && modal.type === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-5 md:p-6">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold mb-2">Delete announcement</h2>
            <p className="text-gray-600 text-sm">
              Are you sure you want to delete{" "}
              <span className="font-medium">{modal.announcement.title}</span>?
              This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60 bg-[#E43125] hover:bg-[#c9281e]"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${
            toast.kind === "success" ? "bg-green-600" : "bg-[#E43125]"
          }`}
        >
          {toast.kind === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <XCircle size={18} />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Announcements;
