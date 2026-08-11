"use client";

import { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  CheckCircle2,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AnnouncementCategory = "league" | "trial" | "news";

interface Announcement {
  id: number;
  title: string;
  body: string;
  category: AnnouncementCategory;
  ctaLabel: string | null;
  ctaUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

interface AnnouncementFormState {
  title: string;
  category: AnnouncementCategory;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
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
];

const CATEGORY_BADGES: Record<
  AnnouncementCategory,
  { label: string; className: string }
> = {
  league: { label: "League Registration", className: "bg-[#E43125] text-white" },
  trial: { label: "Trials", className: "bg-[#020022] text-white" },
  news: { label: "News", className: "bg-gray-200 text-gray-700" },
};

const EMPTY_FORM: AnnouncementFormState = {
  title: "",
  category: "news",
  body: "",
  ctaLabel: "",
  ctaUrl: "",
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

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setModal({ type: "create" });
  };

  const openEditModal = (announcement: Announcement) => {
    setForm({
      title: announcement.title,
      category: announcement.category,
      body: announcement.body,
      ctaLabel: announcement.ctaLabel || "",
      ctaUrl: announcement.ctaUrl || "",
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
      ctaLabel: form.ctaLabel.trim() || null,
      ctaUrl: form.ctaUrl.trim() || null,
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
