"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";
import Cookies from "js-cookie";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { parseSchedule, type ParsedFixture } from "@/utils/parseSchedule";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Team {
  id: number;
  ageGroup: string;
  displayName: string;
  leagueName: string;
}

interface Fixture {
  id: number;
  gameNumber: string | null;
  season: string;
  teamId: number | null;
  ageGroup: string;
  division: string;
  competition: string;
  kickoff: string;
  opponent: string;
  isHome: boolean;
  venue: string;
  ourScore: number | null;
  theirScore: number | null;
  status: string;
  source: string;
  notes: string;
  isActive: boolean;
}

type Toast = { kind: "success" | "error"; message: string };

const EMPTY = {
  ageGroup: "",
  kickoff: "",
  opponent: "",
  isHome: true,
  venue: "",
  competition: "TOSL",
  ourScore: "",
  theirScore: "",
};

/** Reads back the wall-clock numbers without the browser's offset. */
const asDate = (value: string): Date => {
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return new Date(value);
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
};

const forInput = (value: string): string => {
  const d = asDate(value);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
};

const pretty = (value: string): string =>
  asDate(value).toLocaleString("en-CA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const FixturesAdmin: NextPage = () => {
  const [rows, setRows] = useState<Fixture[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [season, setSeason] = useState<string>("");
  const [editing, setEditing] = useState<Fixture | "new" | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [isSaving, setIsSaving] = useState(false);

  const savedToken = Cookies.get("auth_token");

  const showToast = useCallback((kind: Toast["kind"], message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const [f, t] = await Promise.all([
        fetch(`${API_URL}/fixtures/all`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        }),
        fetch(`${API_URL}/fixtures/teams/all`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        }),
      ]);
      if (!f.ok) throw new Error("Failed to fetch fixtures");
      setRows(await f.json());
      if (t.ok) setTeams(await t.json());
    } catch (e) {
      console.error(e);
      setLoadError("Could not load the fixtures. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [savedToken]);

  useEffect(() => {
    load();
  }, [load]);

  /** Live preview of the paste, so nothing is saved unseen. */
  const preview = useMemo(
    () =>
      paste.trim()
        ? parseSchedule(
            paste,
            teams.map((t) => t.leagueName).filter(Boolean)
          )
        : null,
    [paste, teams]
  );

  const runImport = async (fixtures: ParsedFixture[]) => {
    if (fixtures.length === 0) return;
    setIsImporting(true);
    try {
      const res = await fetch(`${API_URL}/fixtures/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({ fixtures }),
      });
      if (!res.ok) {
        const problem = await res.json().catch(() => ({}));
        throw new Error(problem?.message || "The import failed");
      }
      const r = await res.json();
      setImportOpen(false);
      setPaste("");
      await load();
      const bits = [
        r.created ? `${r.created} added` : "",
        r.updated ? `${r.updated} updated` : "",
        r.skipped ? `${r.skipped} left alone` : "",
      ].filter(Boolean);
      const created: string[] = r.teamsCreated ?? [];
      showToast(
        "success",
        [
          bits.join(" · ") || "Nothing to change",
          created.length
            ? `New team${created.length === 1 ? "" : "s"} created: ${created.join(
                ", "
              )}. If that is last season's squad moved up, rename the old team ` +
              `under Teams instead and import again.`
            : "",
        ]
          .filter(Boolean)
          .join(" — ")
      );
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "The import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const save = async () => {
    if (!form.ageGroup.trim() || !form.opponent.trim() || !form.kickoff) {
      showToast("error", "Age group, opponent and kick-off are all needed.");
      return;
    }
    setIsSaving(true);
    try {
      const isEdit = editing !== "new" && editing !== null;
      const body = {
        ageGroup: form.ageGroup.trim(),
        opponent: form.opponent.trim(),
        kickoff: form.kickoff.replace("T", " "),
        isHome: form.isHome,
        venue: form.venue.trim(),
        competition: form.competition.trim() || "TOSL",
        ourScore: form.ourScore === "" ? null : Number(form.ourScore),
        theirScore: form.theirScore === "" ? null : Number(form.theirScore),
        status: form.ourScore === "" ? "scheduled" : "played",
      };
      const res = await fetch(
        isEdit
          ? `${API_URL}/fixtures/${(editing as Fixture).id}`
          : `${API_URL}/fixtures`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${savedToken}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const problem = await res.json().catch(() => ({}));
        throw new Error(problem?.message || "Could not save");
      }
      setEditing(null);
      await load();
      showToast("success", isEdit ? "Fixture updated" : "Fixture added");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Could not save");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (fixture: Fixture) => {
    if (
      !window.confirm(
        `Delete ${fixture.ageGroup} ${fixture.isHome ? "vs" : "at"} ${
          fixture.opponent
        }?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/fixtures/${fixture.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (!res.ok) throw new Error("Could not delete");
      await load();
      showToast("success", "Fixture removed");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Could not delete");
    }
  };

  const openEdit = (f: Fixture) => {
    setEditing(f);
    setForm({
      ageGroup: f.ageGroup,
      kickoff: forInput(f.kickoff),
      opponent: f.opponent,
      isHome: f.isHome,
      venue: f.venue,
      competition: f.competition,
      ourScore: f.ourScore == null ? "" : String(f.ourScore),
      theirScore: f.theirScore == null ? "" : String(f.theirScore),
    });
  };

  const seasons = Array.from(
    new Set(rows.map((r) => r.season).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));

  // Default to the newest season rather than showing every year at once. Left
  // as "" until the rows arrive so the first render does not filter to nothing.
  const activeSeason = season || seasons[0] || "";
  const inSeason = activeSeason
    ? rows.filter((f) => f.season === activeSeason)
    : rows;

  const now = Date.now();
  const upcoming = inSeason.filter((f) => asDate(f.kickoff).getTime() >= now);
  const past = inSeason
    .filter((f) => asDate(f.kickoff).getTime() < now)
    .reverse();

  /**
   * A first draft of the match report, on the clipboard.
   *
   * Not saved anywhere — it is a starting point, not a published post. Reza
   * writes the interesting half; this fills in the parts he would otherwise
   * copy off the fixture row by hand and occasionally get wrong.
   */
  const copyReportDraft = async (f: Fixture) => {
    const won = (f.ourScore ?? 0) > (f.theirScore ?? 0);
    const drew = f.ourScore === f.theirScore;
    const teamLabel =
      teams.find((t) => t.id === f.teamId)?.displayName ||
      `Excel Pro NY ${f.ageGroup}`;
    const verb = won ? "beat" : drew ? "drew with" : "lost to";
    const d = asDate(f.kickoff);
    const dayName = d.toLocaleDateString("en-CA", { weekday: "long" });
    const draft = [
      `Title: ${f.ageGroup} ${verb} ${f.opponent} ${f.ourScore}-${f.theirScore}`,
      "",
      "Category: Match Report",
      `Date it happened: ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      "",
      "Body:",
      `Our ${f.ageGroup}s ${verb} ${f.opponent} ${f.ourScore}-${f.theirScore} on ${dayName}${
        f.venue ? ` at ${f.venue}` : ""
      }.`,
      "",
      "The full story:",
      `${teamLabel} ${verb} ${f.opponent} ${f.ourScore}-${f.theirScore} in the ${
        f.competition || "TOSL"
      } on ${dayName}${f.venue ? ` at ${f.venue}` : ""}.`,
      "",
      "## Goals",
      "",
      "- ",
      "",
      "## How it went",
      "",
      "",
      "## Next up",
      "",
      "",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(draft);
      showToast(
        "success",
        "Draft copied — paste it into Announcements and fill in the goals"
      );
    } catch {
      window.prompt("Copy this draft", draft);
    }
  };

  const Table = ({ list, title }: { list: Fixture[]; title: string }) => (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-[#020022]">
        {title}{" "}
        <span className="text-sm font-normal text-gray-500">
          ({list.length})
        </span>
      </h2>
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          Nothing here.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {list.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-3.5 last:border-b-0"
            >
              <span className="w-14 shrink-0 rounded bg-gray-100 px-2 py-1 text-center text-xs font-extrabold text-gray-700">
                {f.ageGroup || "—"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#020022]">
                  {f.isHome ? "vs" : "at"} {f.opponent}
                  {f.ourScore != null && f.theirScore != null && (
                    <span className="ml-2 rounded bg-[#020022] px-1.5 py-0.5 text-[11px] font-extrabold text-white">
                      {f.ourScore}&ndash;{f.theirScore}
                    </span>
                  )}
                  {f.source === "manual" && (
                    <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      edited by hand
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {pretty(f.kickoff)} · {f.venue || "Venue TBD"}
                  {f.gameNumber ? ` · game ${f.gameNumber}` : ""}
                </span>
              </span>
              <span className="flex shrink-0 gap-2">
                {f.ourScore != null && f.theirScore != null && (
                  <button
                    onClick={() => copyReportDraft(f)}
                    title="Copy a match report draft"
                    aria-label={`Copy a match report draft for ${f.opponent}`}
                    className="rounded-lg border border-gray-300 p-2 text-[#020022] transition hover:bg-gray-50"
                  >
                    <FileText size={15} />
                  </button>
                )}
                <button
                  onClick={() => openEdit(f)}
                  aria-label={`Edit ${f.opponent}`}
                  className="rounded-lg border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-50"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => remove(f)}
                  aria-label={`Delete ${f.opponent}`}
                  className="rounded-lg border border-gray-300 p-2 text-red-500 transition hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold md:text-3xl">Fixtures</h1>
          <p className="text-sm text-gray-500">
            Shown on the home page and on the matchday page. Import the league
            spreadsheet, or add a game by hand.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {seasons.length > 1 && (
            <select
              value={activeSeason}
              onChange={(e) => setSeason(e.target.value)}
              aria-label="Season"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-[#020022]"
            >
              {seasons.map((s) => (
                <option key={s} value={s}>
                  {s} season
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c4291f]"
          >
            <ClipboardPaste size={16} />
            Import schedule
          </button>
          <button
            onClick={() => {
              setEditing("new");
              setForm({ ...EMPTY });
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-[#020022] transition hover:bg-gray-50"
          >
            <Plus size={16} />
            Add a game
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`mb-4 flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
            toast.kind === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {toast.kind === "success" ? (
            <CheckCircle2 size={16} className="mt-0.5" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5" />
          )}
          {toast.message}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <Loader2 className="animate-spin text-[#E43125]" />
          <span className="ml-3 text-gray-600">Loading fixtures…</span>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white px-4 py-16 text-center">
          <XCircle className="mb-3 h-10 w-10 text-[#E43125]" />
          <p className="mb-4 text-gray-700">{loadError}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              load();
            }}
            className="inline-flex items-center gap-2 rounded-md bg-[#E43125] px-4 py-2 text-sm font-medium text-white"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      ) : (
        <>
          <Table list={upcoming} title="Coming up" />
          <Table list={past} title="Played" />
        </>
      )}

      {/* ------------------------------------------------------- importer */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#020022]">
                Import the league schedule
              </h2>
              <button
                onClick={() => setImportOpen(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <ol className="mb-4 space-y-1 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              <li>
                <strong>1.</strong> Open the schedule spreadsheet you downloaded
                from the league.
              </li>
              <li>
                <strong>2.</strong> Select the rows (the header row is fine to
                include) and copy.
              </li>
              <li>
                <strong>3.</strong> Paste below. You will see exactly what is
                about to be saved before anything is.
              </li>
            </ol>

            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={6}
              placeholder={
                "Game Number\tDivision\tGame Date\tKick Off\tHome Team\tAway Team\tField"
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs"
            />

            {preview && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-[#020022]">
                  {preview.fixtures.length} game
                  {preview.fixtures.length === 1 ? "" : "s"} ready
                  {preview.duplicates > 0 &&
                    ` · ${preview.duplicates} duplicate${
                      preview.duplicates === 1 ? "" : "s"
                    } collapsed`}
                </p>

                {preview.problems.length > 0 && (
                  <div className="mb-3 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3">
                    <p className="mb-1 text-sm font-semibold text-amber-900">
                      {preview.problems.length} row
                      {preview.problems.length === 1 ? "" : "s"} skipped
                    </p>
                    <ul className="space-y-1 text-xs text-amber-900">
                      {preview.problems.slice(0, 6).map((p) => (
                        <li key={p.line}>
                          Line {p.line}: {p.reason}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-amber-800">
                      If a row says neither team looks like ours, set that
                      team&apos;s league name under Dashboard &rsaquo; Teams and
                      paste again.
                    </p>
                  </div>
                )}

                {preview.fixtures.length > 0 && (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                    {preview.fixtures.map((f, i) => (
                      <div
                        key={`${f.gameNumber}-${i}`}
                        className="flex items-center gap-3 border-b border-gray-100 px-3 py-2 text-xs last:border-b-0"
                      >
                        <span className="w-11 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-center font-extrabold text-gray-700">
                          {f.ageGroup || "?"}
                        </span>
                        <span className="w-32 shrink-0 text-gray-600">
                          {f.kickoff}
                        </span>
                        <span className="flex-1 font-semibold text-[#020022]">
                          {f.isHome ? "vs" : "at"} {f.opponent}
                        </span>
                        <span className="shrink-0 text-gray-500">
                          {f.venue || "TBD"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Importing the same file twice is safe — games are matched on the
                league&apos;s game number. Anything you have edited by hand is
                left alone.
              </p>
              <div className="flex shrink-0 gap-3">
                <button
                  onClick={() => setImportOpen(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => runImport(preview?.fixtures ?? [])}
                  disabled={isImporting || !preview?.fixtures.length}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isImporting && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Import {preview?.fixtures.length || 0}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- add / edit */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#020022]">
                {editing === "new" ? "Add a game" : "Edit game"}
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Team
                  </label>
                  <input
                    list="age-groups"
                    value={form.ageGroup}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ageGroup: e.target.value }))
                    }
                    placeholder="U13"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <datalist id="age-groups">
                    {teams.map((t) => (
                      <option key={t.id} value={t.ageGroup} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Kick-off
                  </label>
                  <input
                    type="datetime-local"
                    value={form.kickoff}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, kickoff: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Opponent
                </label>
                <input
                  value={form.opponent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, opponent: e.target.value }))
                  }
                  placeholder="Slavia FC"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isHome: true }))}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold ${
                    form.isHome
                      ? "border-[#E43125] bg-[#fff5f4] text-[#E43125]"
                      : "border-gray-300 text-gray-600"
                  }`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isHome: false }))}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold ${
                    !form.isHome
                      ? "border-[#E43125] bg-[#fff5f4] text-[#E43125]"
                      : "border-gray-300 text-gray-600"
                  }`}
                >
                  Away
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Field
                </label>
                <input
                  value={form.venue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, venue: e.target.value }))
                  }
                  placeholder="North York Civic Field 3E"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Score (leave blank until it is played)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={form.ourScore}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ourScore: e.target.value }))
                    }
                    placeholder="Us"
                    className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <span className="text-gray-400">&ndash;</span>
                  <input
                    type="number"
                    min={0}
                    value={form.theirScore}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, theirScore: e.target.value }))
                    }
                    placeholder="Them"
                    className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              Saving marks this game as edited by hand, so a later import of
              the league spreadsheet will not overwrite it.
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={save}
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

export default FixturesAdmin;
