"use client";

import { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Coach {
  id: number;
  name: string;
  role: string;
  bio: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

/** An image already in the Gallery, reusable across coaches. */
interface GalleryImage {
  id: string;
  title: string;
  image_url: string;
}

interface CoachFormState {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  isActive: boolean;
}

interface ToastState {
  kind: "success" | "error";
  message: string;
}

type ModalState =
  | { type: "create" }
  | { type: "edit"; coach: Coach }
  | { type: "delete"; coach: Coach };

const EMPTY_FORM: CoachFormState = {
  name: "",
  role: "",
  bio: "",
  imageUrl: "",
  isActive: true,
};

/**
 * Common titles, offered as a datalist rather than a fixed dropdown. The
 * academy invents new roles faster than we can ship enum changes, so the
 * suggestions save typing without becoming a cage.
 */
const ROLE_SUGGESTIONS = [
  "Founder & Head Coach",
  "Head Coach & Teams Manager",
  "Head Coach",
  "Assistant Coach",
  "Youth Coach",
  "Goalkeeping Coach",
  "Fitness & Conditioning Coach",
  "Technical Director",
];

const Coaches: NextPage = () => {
  const [rows, setRows] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<CoachFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const savedToken = Cookies.get("auth_token");

  const showToast = useCallback((kind: "success" | "error", message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchCoaches = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await fetch(`${API_URL}/coaches/all`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch coaches");
      const data: Coach[] = await response.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching coaches:", error);
      setLoadError("Could not load the coaches. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [savedToken]);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

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

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("error", "That file is not an image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "That photo is over 10MB. Please choose a smaller one.");
      return;
    }
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("title", file.name.replace(/\.[^.]+$/, ""));
      const response = await fetch(`${API_URL}/gallery`, {
        method: "POST",
        headers: { Authorization: `Bearer ${savedToken}` },
        body,
      });
      if (!response.ok) throw new Error("Upload failed");
      const created = await response.json();
      const url = created?.image_url || created?.data?.image_url;
      if (!url) throw new Error("Upload did not return an image URL");
      setForm((f) => ({ ...f, imageUrl: url }));
      setGalleryOpen(false);
      fetchGallery();
      showToast("success", "Photo uploaded and selected");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not upload the photo"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModal(null);
    setGalleryOpen(false);
  };

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setModal({ type: "create" });
  };

  const openEditModal = (coach: Coach) => {
    setForm({
      name: coach.name,
      role: coach.role,
      bio: coach.bio ?? "",
      imageUrl: coach.imageUrl ?? "",
      isActive: coach.isActive,
    });
    setModal({ type: "edit", coach });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.role.trim()) {
      showToast("error", "A coach needs at least a name and a role.");
      return;
    }
    setIsSubmitting(true);
    try {
      const isEdit = modal?.type === "edit";
      const url = isEdit
        ? `${API_URL}/coaches/${(modal as { coach: Coach }).coach.id}`
        : `${API_URL}/coaches`;
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role.trim(),
          bio: form.bio.trim(),
          imageUrl: form.imageUrl.trim(),
          isActive: form.isActive,
        }),
      });
      if (!response.ok) throw new Error("Save failed");
      setModal(null);
      await fetchCoaches();
      showToast("success", isEdit ? "Coach updated" : "Coach added");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not save the coach"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (modal?.type !== "delete") return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/coaches/${modal.coach.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (!response.ok) throw new Error("Delete failed");
      setModal(null);
      await fetchCoaches();
      showToast("success", "Coach removed");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not remove the coach"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (coach: Coach) => {
    try {
      const response = await fetch(`${API_URL}/coaches/${coach.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({ isActive: !coach.isActive }),
      });
      if (!response.ok) throw new Error("Update failed");
      await fetchCoaches();
      showToast(
        "success",
        coach.isActive
          ? `${coach.name} is hidden from the website`
          : `${coach.name} is back on the website`
      );
    } catch {
      showToast("error", "Could not change that coach's visibility");
    }
  };

  /**
   * Move a coach one place up or down. The new order is sent to the server as
   * a full list, and the local state is updated first so the row visibly moves
   * without waiting for the round trip.
   */
  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    setIsReordering(true);
    try {
      const response = await fetch(`${API_URL}/coaches/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({ ids: next.map((c) => c.id) }),
      });
      if (!response.ok) throw new Error("Reorder failed");
      const saved: Coach[] = await response.json();
      if (Array.isArray(saved)) setRows(saved);
    } catch {
      showToast("error", "Could not save the new order");
      fetchCoaches();
    } finally {
      setIsReordering(false);
    }
  };

  const visibleCount = rows.filter((c) => c.isActive).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#020022] flex items-center gap-2">
            <UserRound className="w-6 h-6 text-[#E43125]" />
            Coaches
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {visibleCount} on the website
            {rows.length !== visibleCount
              ? ` · ${rows.length - visibleCount} hidden`
              : ""}
            . The order here is the order parents see at excelproso.com/coaches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsLoading(true);
              fetchCoaches();
            }}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[#E43125] hover:bg-[#c9281e] text-white rounded-md font-medium"
          >
            <Plus size={16} />
            Add a coach
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-md text-sm ${
            toast.kind === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.kind === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <XCircle size={18} />
          )}
          {toast.message}
        </div>
      )}

      {loadError && (
        <div className="mb-4 px-4 py-3 rounded-md text-sm bg-red-50 text-red-800 border border-red-200">
          {loadError}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={20} />
          Loading coaches…
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl">
          <UserRound className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No coaches yet.</p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm bg-[#E43125] hover:bg-[#c9281e] text-white rounded-md font-medium"
          >
            <Plus size={16} />
            Add the first one
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((coach, index) => (
            <div
              key={coach.id}
              className={`flex items-start gap-4 p-4 bg-white border rounded-xl ${
                coach.isActive ? "border-gray-200" : "border-gray-200 opacity-60"
              }`}
            >
              {/* Order controls */}
              <div className="flex flex-col gap-1 pt-1">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || isReordering}
                  title="Move up"
                  className="p-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1 || isReordering}
                  title="Move down"
                  className="p-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              {/* Photo */}
              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {coach.imageUrl ? (
                  // Photos can come from the Gallery on another domain, so a
                  // plain img avoids next/image remote-host configuration.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coach.imageUrl}
                    alt={coach.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={20} />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-[#020022]">{coach.name}</h2>
                  {!coach.isActive && (
                    <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#E43125]">{coach.role}</p>
                {coach.bio && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {coach.bio}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleActive(coach)}
                  title={
                    coach.isActive
                      ? "Hide from the website"
                      : "Show on the website"
                  }
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-50"
                >
                  {coach.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => openEditModal(coach)}
                  title="Edit"
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-50"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setModal({ type: "delete", coach })}
                  title="Remove"
                  className="p-2 rounded-md text-gray-500 hover:bg-red-50 hover:text-[#E43125]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / edit modal */}
      {(modal?.type === "create" || modal?.type === "edit") && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-8 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#020022]">
                {modal.type === "edit" ? "Edit coach" : "Add a coach"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Iman Badamaki"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#E43125]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                    list="coach-role-suggestions"
                    placeholder="Youth Coach"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#E43125]/30"
                  />
                  <datalist id="coach-role-suggestions">
                    {ROLE_SUGGESTIONS.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={6}
                  placeholder="Playing history, coaching licences, teams and achievements."
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#E43125]/30"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Around 3 to 5 sentences reads best. Longer bios still work —
                  the cards stretch to match the tallest one.
                </p>
              </div>

              {/* Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                    {form.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.imageUrl}
                        alt="Selected"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ImageIcon size={22} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setGalleryOpen(true)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                      >
                        <ImageIcon size={16} />
                        Choose from gallery
                      </button>
                      <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                        {isUploading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Upload size={16} />
                        )}
                        {isUploading ? "Uploading…" : "Upload a new photo"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploading}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(file);
                          }}
                        />
                      </label>
                      {form.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, imageUrl: "" })}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-[#E43125]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      A head-and-shoulders photo works best — the card crops to
                      a square from the top, so a full-body shot leaves the face
                      very small.
                    </p>
                  </div>
                </div>

                {galleryOpen && (
                  <div className="mt-3 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Gallery
                      </span>
                      <button
                        type="button"
                        onClick={() => setGalleryOpen(false)}
                        className="text-gray-400 hover:text-gray-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {gallery.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">
                        No photos in the gallery yet. Upload one instead.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto">
                        {gallery.map((image) => (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, imageUrl: image.image_url });
                              setGalleryOpen(false);
                            }}
                            className="aspect-square rounded-md overflow-hidden border border-gray-200 hover:border-[#E43125]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.image_url}
                              alt={image.title}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300 text-[#E43125] focus:ring-[#E43125]"
                />
                Show this coach on the website
              </label>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm bg-[#E43125] hover:bg-[#c9281e] text-white rounded-md font-medium disabled:opacity-60"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {modal.type === "edit" ? "Save changes" : "Add coach"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {modal?.type === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-5">
              <h2 className="text-lg font-bold text-[#020022]">
                Remove {modal.coach.name}?
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                This deletes the coach permanently. If you only want them off
                the website for now, close this and use the eye icon to hide
                them instead — that keeps the bio and photo.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm bg-[#E43125] hover:bg-[#c9281e] text-white rounded-md font-medium disabled:opacity-60"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coaches;
