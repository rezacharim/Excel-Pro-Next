"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NextPage } from "next";
import Cookies from "js-cookie";
import {
  AlertTriangle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Plus,
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

interface Team {
  id: number;
  ageGroup: string;
  displayName: string;
  leagueName: string;
  photoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface GalleryImage {
  id: string;
  image_url: string;
  title?: string;
}

/**
 * The photo used when a team has none of its own.
 *
 * Mirrors the fallback on the public site. It is shown here greyed out with a
 * warning, because the U9-U12 file covers both the U10 and the U12 side — two
 * teams, one picture, which is the whole reason this screen exists.
 */
const BRACKET = (ageGroup: string): string => {
  const n = Number(String(ageGroup).replace(/\D/g, "")) || 99;
  if (n <= 8) return "/images/person/team/u7.webp";
  if (n <= 12) return "/images/person/team/u9-u12.webp";
  if (n <= 14) return "/images/person/team/u13-u14.jpeg";
  return "/images/person/team/u15-u18.jpeg";
};

type Toast = { kind: "success" | "error"; message: string };

const TeamsAdmin: NextPage = () => {
  const [rows, setRows] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [editing, setEditing] = useState<Team | null>(null);
  const [photoFor, setPhotoFor] = useState<Team | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ displayName: "", leagueName: "", ageGroup: "" });
  const fileInput = useRef<HTMLInputElement>(null);

  const savedToken = Cookies.get("auth_token");

  const showToast = useCallback((kind: Toast["kind"], message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchTeams = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await fetch(`${API_URL}/fixtures/teams/all`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch teams");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setLoadError("Could not load the teams. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [savedToken]);

  const fetchGallery = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/gallery`);
      if (!res.ok) return;
      const data = await res.json();
      setGallery(Array.isArray(data) ? data : []);
    } catch {
      // The picker failing is not worth an error banner — upload still works.
    }
  }, []);

  useEffect(() => {
    fetchTeams();
    fetchGallery();
  }, [fetchTeams, fetchGallery]);

  const patch = async (id: number, body: Record<string, unknown>) => {
    const res = await fetch(`${API_URL}/fixtures/teams/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${savedToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const problem = await res.json().catch(() => ({}));
      throw new Error(problem?.message || "Could not save");
    }
    return res.json();
  };

  const setPhoto = async (team: Team, url: string) => {
    setIsSaving(true);
    try {
      await patch(team.id, { photoUrl: url });
      setPhotoFor(null);
      await fetchTeams();
      showToast("success", `${team.ageGroup} photo updated`);
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Could not save");
    } finally {
      setIsSaving(false);
    }
  };

  const upload = async (team: Team, rawFile: File) => {
    if (!rawFile.type.startsWith("image/")) {
      showToast("error", "That file is not an image.");
      return;
    }
    setIsUploading(true);
    try {
      // Vercel rejects any body over 4.5MB at the edge, before the server sees
      // it, and reports nothing but "Failed to fetch".
      const file = await compressImage(rawFile);
      if (file.size > MAX_UPLOAD_BYTES) {
        showToast(
          "error",
          `That photo is ${formatBytes(file.size)} and still too large after ` +
            `resizing. Save it as a JPEG and try again.`
        );
        return;
      }
      const body = new FormData();
      body.append("file", file);
      body.append("title", `${team.ageGroup} team photo`);
      const res = await fetch(`${API_URL}/gallery`, {
        method: "POST",
        headers: { Authorization: `Bearer ${savedToken}` },
        body,
      });
      if (!res.ok) {
        let detail = "";
        try {
          const p = await res.json();
          detail = p?.message || p?.error || "";
        } catch {
          detail = "";
        }
        throw new Error(detail || `Upload failed (server said ${res.status})`);
      }
      const created = await res.json();
      const url = created?.image_url || created?.data?.image_url;
      if (!url) throw new Error("Upload did not return an image URL");
      fetchGallery();
      await setPhoto(team, url);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      showToast(
        "error",
        /failed to fetch|networkerror|load failed/i.test(raw)
          ? "The photo could not be sent — it is probably too large."
          : raw || "Could not upload the photo"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const saveNames = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      await patch(editing.id, {
        displayName: form.displayName.trim(),
        leagueName: form.leagueName.trim(),
        ageGroup: form.ageGroup.trim() || editing.ageGroup,
      });
      setEditing(null);
      await fetchTeams();
      showToast("success", "Team updated");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Could not save");
    } finally {
      setIsSaving(false);
    }
  };

  const addTeam = async () => {
    const ageGroup = window.prompt("Age group for the new team, e.g. U11");
    if (!ageGroup?.trim()) return;
    try {
      const res = await fetch(`${API_URL}/fixtures/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({ ageGroup: ageGroup.trim() }),
      });
      if (!res.ok) throw new Error("Could not add the team");
      await fetchTeams();
      showToast("success", `${ageGroup.trim()} added`);
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Could not add");
    }
  };

  const removeTeam = async (team: Team) => {
    if (
      !window.confirm(
        `Remove ${team.displayName || team.ageGroup}? Its games stay in the ` +
          `fixture list — only the team's name and photo are deleted.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/fixtures/teams/${team.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (!res.ok) throw new Error("Could not remove the team");
      await fetchTeams();
      showToast("success", "Team removed");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Could not remove");
    }
  };

  // Two teams falling back to the same bracket file is the problem this screen
  // was built to fix, so it is called out rather than left to be noticed.
  const sharedFallback = new Set<string>();
  const counts = new Map<string, number>();
  rows
    .filter((t) => !t.photoUrl)
    .forEach((t) => {
      const b = BRACKET(t.ageGroup);
      counts.set(b, (counts.get(b) ?? 0) + 1);
    });
  rows
    .filter((t) => !t.photoUrl && (counts.get(BRACKET(t.ageGroup)) ?? 0) > 1)
    .forEach((t) => sharedFallback.add(t.ageGroup));

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold md:text-3xl">Teams</h1>
          <p className="text-sm text-gray-500">
            The photo here is the one on the home page next-game card and on
            the matchday page.
          </p>
        </div>
        <button
          onClick={addTeam}
          className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c4291f]"
        >
          <Plus size={16} />
          Add a team
        </button>
      </div>

      {/* The summer season ends in September and the Winter League redraws the
          age groups, so this comes up every October. Explaining it once here
          is cheaper than Reza discovering a duplicate team after an import. */}
      {rows.length > 0 && (
        <div className="mb-6 rounded-xl border-l-4 border-[#020022] bg-gray-50 p-4">
          <p className="text-sm font-semibold text-[#020022]">
            When the age groups change in October
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Use <strong>Edit name</strong> to move a squad up — change U10 to
            U11 and every game they have already played stays with them, still
            labelled U10. Do that <em>before</em> importing the winter
            schedule, or the import will create a second U11 team instead.
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
          <span className="ml-3 text-gray-600">Loading teams…</span>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white px-4 py-16 text-center">
          <XCircle className="mb-3 h-10 w-10 text-[#E43125]" />
          <p className="mb-4 text-gray-700">{loadError}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              fetchTeams();
            }}
            className="inline-flex items-center gap-2 rounded-md bg-[#E43125] px-4 py-2 text-sm font-medium text-white"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-gray-600">
          No teams yet. Add one and its games will group under it.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {rows.map((team) => (
            <div
              key={team.id}
              className="flex flex-wrap items-center gap-4 border-b border-gray-100 p-4 last:border-b-0"
            >
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={team.photoUrl || BRACKET(team.ageGroup)}
                  alt=""
                  className={`h-full w-full object-cover ${
                    team.photoUrl ? "" : "opacity-60"
                  }`}
                />
                <span className="absolute bottom-1 left-2 text-sm font-extrabold text-white drop-shadow">
                  {team.ageGroup}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-bold text-[#020022]">
                  {team.displayName || `Excel Pro NY ${team.ageGroup}`}
                  {!team.photoUrl && sharedFallback.has(team.ageGroup) && (
                    <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                      sharing a photo — upload one
                    </span>
                  )}
                  {!team.photoUrl && !sharedFallback.has(team.ageGroup) && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      no photo yet
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  In the league spreadsheet:{" "}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5">
                    {team.leagueName || "not set"}
                  </code>
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setPhotoFor(team)}
                  className="rounded-lg border border-gray-300 px-3.5 py-2 text-xs font-semibold text-[#020022] transition hover:bg-gray-50"
                >
                  Change photo
                </button>
                <button
                  onClick={() => {
                    setEditing(team);
                    setForm({
                      displayName:
                        team.displayName || `Excel Pro NY ${team.ageGroup}`,
                      leagueName: team.leagueName,
                      ageGroup: team.ageGroup,
                    });
                  }}
                  className="rounded-lg border border-gray-300 px-3.5 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Edit name
                </button>
                <button
                  onClick={() => removeTeam(team)}
                  aria-label={`Remove ${team.ageGroup}`}
                  className="rounded-lg border border-gray-300 p-2 text-red-500 transition hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------- photo */}
      {photoFor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-[#020022]">
                {photoFor.ageGroup} — team photo
              </h2>
              <button
                onClick={() => setPhotoFor(null)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="h-20 w-32 overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoFor.photoUrl || BRACKET(photoFor.ageGroup)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                onClick={() => fileInput.current?.click()}
                disabled={isUploading || isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ImagePlus size={16} />
                )}
                Upload a photo
              </button>
              {photoFor.photoUrl && (
                <button
                  onClick={() => setPhoto(photoFor, "")}
                  className="text-sm text-gray-500 underline"
                >
                  Remove
                </button>
              )}
            </div>

            <p className="mb-2 text-sm font-medium text-gray-700">
              Or choose from your gallery
            </p>
            <p className="mb-3 text-xs text-gray-500">
              Landscape photos work best — the card is wide, so a portrait phone
              photo gets cropped top and bottom.
            </p>
            {gallery.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Nothing in the gallery yet. Use Upload a photo instead.
              </p>
            ) : (
              <div className="grid max-h-72 grid-cols-4 gap-3 overflow-y-auto">
                {gallery.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => setPhoto(photoFor, image.image_url)}
                    disabled={isSaving}
                    className="aspect-video overflow-hidden rounded-lg ring-1 ring-gray-200 transition hover:ring-2 hover:ring-[#E43125] disabled:opacity-50"
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

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && photoFor) upload(photoFor, f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- names */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-[#020022]">
                {editing.ageGroup} — names
              </h2>
              <button
                onClick={() => setEditing(null)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Age group
                </label>
                <input
                  value={form.ageGroup}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ageGroup: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name shown on the website
                </label>
                <input
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                  placeholder="Excel Pro NY U13"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name in the league spreadsheet
                </label>
                <p className="mb-1 text-xs text-gray-500">
                  Copy it exactly as TOSL writes it. The import uses this to
                  work out whether we are the home or the away side — if it is
                  wrong, every game imports back to front.
                </p>
                <input
                  value={form.leagueName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, leagueName: e.target.value }))
                  }
                  placeholder="NY Hearts A BU13T2 TOSL"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveNames}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsAdmin;
