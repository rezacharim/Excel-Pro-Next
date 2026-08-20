"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NextPage } from "next";
import Cookies from "js-cookie";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Quote,
  RefreshCw,
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

interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface GalleryImage {
  id: string;
  image_url: string;
  title?: string;
}

interface FormState {
  name: string;
  role: string;
  quote: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  role: "",
  quote: "",
  imageUrl: "",
  isActive: true,
};

/**
 * Concrete beats generic. "Parent of Arsham, U13" persuades another parent in
 * a way that "Parent" or a city name never will, so the suggestions push
 * towards naming the player and the age group.
 */
const ROLE_SUGGESTIONS = [
  "Parent of {name}, U13",
  "Parent of two players, U9 and U13",
  "U15 player",
  "Former player",
  "Team manager",
];

type ToastState = { kind: "success" | "error"; message: string };
type ModalState = { mode: "create" } | { mode: "edit"; id: number };

const initials = (name: string): string =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

const TestimonialsAdmin: NextPage = () => {
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Testimonial | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const savedToken = Cookies.get("auth_token");

  const showToast = useCallback((kind: ToastState["kind"], message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchRows = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await fetch(`${API_URL}/testimonials/all`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch testimonials");
      const data: Testimonial[] = await response.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      setLoadError("Could not load the testimonials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [savedToken]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  /** The same Gallery as Dashboard > Gallery. */
  const fetchGallery = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/gallery`);
      if (!response.ok) return;
      const data = await response.json();
      setGallery(Array.isArray(data) ? data : []);
    } catch {
      // A picker that cannot load is not worth an error banner — a new photo
      // can still be uploaded.
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handlePhotoUpload = async (rawFile: File) => {
    if (!rawFile.type.startsWith("image/")) {
      showToast("error", "That file is not an image.");
      return;
    }
    setIsUploading(true);
    try {
      // Shrink first. Vercel rejects any body over 4.5MB at the edge, and
      // that arrives as a bare "Failed to fetch" with no explanation.
      const file = await compressImage(rawFile);
      if (file.size > MAX_UPLOAD_BYTES) {
        showToast(
          "error",
          `That photo is ${formatBytes(file.size)} and still too large after ` +
            `resizing. Please save it as a JPEG and try again.`
        );
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
      setForm((f) => ({ ...f, imageUrl: url }));
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

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ mode: "create" });
  };

  const openEdit = (row: Testimonial) => {
    setForm({
      name: row.name,
      role: row.role ?? "",
      quote: row.quote ?? "",
      imageUrl: row.imageUrl ?? "",
      isActive: row.isActive,
    });
    setModal({ mode: "edit", id: row.id });
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModal(null);
    setGalleryOpen(false);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      showToast("error", "A name is required.");
      return;
    }
    if (!form.quote.trim()) {
      showToast("error", "A testimonial needs something to say.");
      return;
    }
    setIsSubmitting(true);
    try {
      const isEdit = modal?.mode === "edit";
      const response = await fetch(
        isEdit ? `${API_URL}/testimonials/${modal.id}` : `${API_URL}/testimonials`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${savedToken}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            role: form.role.trim(),
            quote: form.quote.trim(),
            imageUrl: form.imageUrl.trim(),
            isActive: form.isActive,
          }),
        }
      );
      if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        throw new Error(problem?.message || "Could not save");
      }
      setModal(null);
      await fetchRows();
      showToast("success", isEdit ? "Testimonial updated" : "Testimonial added");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not save"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (row: Testimonial) => {
    try {
      const response = await fetch(`${API_URL}/testimonials/${row.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      if (!response.ok) throw new Error("Could not update");
      setRows((list) =>
        list.map((r) => (r.id === row.id ? { ...r, isActive: !r.isActive } : r))
      );
    } catch {
      showToast("error", "Could not change whether that one is showing");
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    try {
      const response = await fetch(
        `${API_URL}/testimonials/${confirmDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${savedToken}` },
        }
      );
      if (!response.ok) throw new Error("Could not delete");
      setConfirmDelete(null);
      await fetchRows();
      showToast("success", "Testimonial removed");
    } catch {
      showToast("error", "Could not remove that testimonial");
    }
  };

  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    // Optimistic: the arrows should feel instant. If the save fails we reload
    // and the list snaps back to what the server actually holds.
    setRows(next);
    setIsReordering(true);
    try {
      const response = await fetch(`${API_URL}/testimonials/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({ ids: next.map((r) => r.id) }),
      });
      if (!response.ok) throw new Error("Could not reorder");
    } catch {
      showToast("error", "Could not save the new order");
      fetchRows();
    } finally {
      setIsReordering(false);
    }
  };

  const liveCount = rows.filter((r) => r.isActive).length;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold md:text-3xl">Testimonials</h1>
          <p className="text-sm text-gray-500">
            What parents and players say, shown on the home page and the
            programs page.{" "}
            {liveCount === 0
              ? "Nothing is showing right now — the section is hidden until you add one."
              : `${liveCount} showing on the site.`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c4291f]"
        >
          <Plus size={16} />
          Add a testimonial
        </button>
      </div>

      {/* Why the list may be empty. Worth saying once, plainly. */}
      {!isLoading && rows.length === 0 && !loadError && (
        <div className="mb-6 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4">
          <p className="text-sm text-gray-700">
            The four quotes that used to appear here — James Rock, Sarah
            Johnson, Michael Chen and Emma Wilson — came with the website
            template. They were not real families, so they have been removed.
            Add a real one and the section comes back.
          </p>
        </div>
      )}

      {toast && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            toast.kind === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {toast.kind === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {toast.message}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <Loader2 className="animate-spin text-[#E43125]" />
          <span className="ml-3 text-gray-600">Loading testimonials…</span>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white px-4 py-16 text-center">
          <XCircle className="mb-3 h-10 w-10 text-[#E43125]" />
          <p className="mb-4 text-gray-700">{loadError}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              fetchRows();
            }}
            className="inline-flex items-center gap-2 rounded-md bg-[#E43125] px-4 py-2 text-sm font-medium text-white"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Quote className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-semibold text-[#020022]">No testimonials yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Ask a parent after a good result — that is when they say the things
            worth quoting. A photo helps but is not required.
          </p>
          <button
            onClick={openCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            Add the first one
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={`flex flex-col gap-4 rounded-xl border bg-white p-4 sm:flex-row sm:items-start ${
                row.isActive ? "border-gray-200" : "border-gray-200 opacity-60"
              }`}
            >
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || isReordering}
                  aria-label="Move up"
                  className="rounded border border-gray-200 p-1 text-gray-500 transition hover:bg-gray-50 disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1 || isReordering}
                  aria-label="Move down"
                  className="rounded border border-gray-200 p-1 text-gray-500 transition hover:bg-gray-50 disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-100">
                {row.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-[#020022] text-sm font-bold text-white">
                    {initials(row.name)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#020022]">
                  {row.name}
                  {!row.isActive && (
                    <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                      Hidden
                    </span>
                  )}
                </p>
                {row.role && (
                  <p className="text-xs text-gray-500">{row.role}</p>
                )}
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {row.quote}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => toggleActive(row)}
                  title={row.isActive ? "Hide from the site" : "Show on the site"}
                  aria-label={
                    row.isActive ? "Hide from the site" : "Show on the site"
                  }
                  className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50"
                >
                  {row.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => openEdit(row)}
                  aria-label={`Edit ${row.name}`}
                  className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setConfirmDelete(row)}
                  aria-label={`Delete ${row.name}`}
                  className="rounded-lg border border-gray-200 p-2 text-red-500 transition hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --------------------------------------------------- add / edit */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#020022]">
                {modal.mode === "edit" ? "Edit testimonial" : "Add a testimonial"}
              </h2>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Somayeh Hosseini"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Who they are
                </label>
                <p className="mb-1 text-xs text-gray-500">
                  Name the player and the age group. &ldquo;Parent of Arsham,
                  U13&rdquo; carries far more weight with another parent than
                  &ldquo;Parent&rdquo;.
                </p>
                <input
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                  placeholder="e.g. Parent of Arsham, U13"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {ROLE_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: s }))}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 transition hover:bg-gray-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  What they said
                </label>
                <p className="mb-1 text-xs text-gray-500">
                  Their words, not polished. A specific sentence about one thing
                  beats a paragraph of praise.
                </p>
                <textarea
                  value={form.quote}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quote: e.target.value }))
                  }
                  rows={5}
                  placeholder="e.g. He was the quiet one at the back of every session in September. Last week he asked the coach if he could stay late to practise finishing."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Photo (optional)
                </label>
                <p className="mb-2 text-xs text-gray-500">
                  A real quote with no photo is worth more than a real quote
                  with a stock one. Leave it blank and their initials show
                  instead.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-100">
                    {form.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-[#020022] text-sm font-bold text-white">
                        {initials(form.name)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ImagePlus size={16} />
                    )}
                    Upload a photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryOpen(true)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
                  >
                    Choose from gallery
                  </button>
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                      className="text-sm text-gray-500 underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                    e.target.value = "";
                  }}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="h-4 w-4"
                />
                Show this on the website
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c4291f] disabled:opacity-50"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {modal.mode === "edit" ? "Save changes" : "Add testimonial"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ gallery picker */}
      {galleryOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-[#020022]">Choose a photo</h3>
              <button
                onClick={() => setGalleryOpen(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            {gallery.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">
                No photos in the gallery yet. Close this and use Upload a photo
                instead.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {gallery.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => {
                      setForm((f) => ({ ...f, imageUrl: image.image_url }));
                      setGalleryOpen(false);
                    }}
                    className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-gray-200 transition hover:ring-2 hover:ring-[#E43125]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.image_url}
                      alt={image.title ?? ""}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="mb-2 text-lg font-bold text-[#020022]">
              Remove this testimonial?
            </h3>
            <p className="mb-5 text-sm text-gray-600">
              {confirmDelete.name} will be deleted for good. If you only want
              it off the site for now, use the eye button to hide it instead.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={remove}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsAdmin;
