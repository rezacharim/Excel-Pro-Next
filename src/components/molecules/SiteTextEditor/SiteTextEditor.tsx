"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import {
  SITE_TEXT_DEFAULTS,
  SITE_TEXT_GROUPS,
  type SiteText,
  type SiteTextKey,
} from "@/services/siteText";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Toast = { kind: "success" | "error"; message: string };

/**
 * Edits the wording on the public site.
 *
 * Only headings and short lines — the parts that used to be written into the
 * components, so changing "Latest from our Instagram" meant a code change and
 * a deploy. Actual content (news, coaches, testimonials, fixtures) has its own
 * screen; this is for the furniture around it.
 */
const SiteTextEditor = () => {
  const [values, setValues] = useState<SiteText>(SITE_TEXT_DEFAULTS);
  const [saved, setSaved] = useState<SiteText>(SITE_TEXT_DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const savedToken = Cookies.get("auth_token");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/site-text`);
      if (res.ok) {
        const data = await res.json();
        const merged = { ...SITE_TEXT_DEFAULTS, ...(data ?? {}) };
        setValues(merged);
        setSaved(merged);
      }
    } catch {
      // Defaults are already in state — the editor still works, it just shows
      // the shipped wording rather than what is live.
      setToast({
        kind: "error",
        message: "Could not load the current wording. Showing the defaults.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = (Object.keys(values) as SiteTextKey[]).filter(
    (k) => values[k] !== saved[k]
  );

  const save = async () => {
    if (dirty.length === 0) return;
    setIsSaving(true);
    try {
      const patch: Partial<Record<SiteTextKey, string>> = {};
      for (const k of dirty) patch[k] = values[k];
      const res = await fetch(`${API_URL}/site-text`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const problem = await res.json().catch(() => ({}));
        throw new Error(problem?.message || "Could not save");
      }
      const data = await res.json();
      const merged = { ...SITE_TEXT_DEFAULTS, ...(data ?? {}) };
      setValues(merged);
      setSaved(merged);
      setToast({
        kind: "success",
        message: `Saved. The website updates within a few minutes.`,
      });
    } catch (e) {
      setToast({
        kind: "error",
        message: e instanceof Error ? e.message : "Could not save",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-white py-16 shadow-sm">
        <Loader2 className="animate-spin text-[#E43125]" />
        <span className="ml-3 text-gray-600">Loading…</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 rounded-lg border-l-4 border-[#020022] bg-gray-50 p-4">
        <p className="text-sm text-gray-700">
          These are the headings on the public site. Clear a box and save to put
          the original wording back.
        </p>
      </div>

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

      <div className="space-y-5">
        {SITE_TEXT_GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-100"
          >
            <h3 className="font-bold text-[#020022]">{group.title}</h3>
            <p className="mb-4 text-xs text-gray-500">{group.note}</p>

            <div className="space-y-3">
              {group.fields.map((field) => {
                const changed = values[field.key] !== saved[field.key];
                const isDefault =
                  values[field.key] === SITE_TEXT_DEFAULTS[field.key];
                return (
                  <div key={field.key}>
                    <label className="mb-1 flex items-center justify-between text-sm font-medium text-gray-700">
                      <span>
                        {field.label}
                        {changed && (
                          <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            unsaved
                          </span>
                        )}
                      </span>
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() =>
                            setValues((v) => ({
                              ...v,
                              [field.key]: SITE_TEXT_DEFAULTS[field.key],
                            }))
                          }
                          className="inline-flex items-center gap-1 text-xs font-normal text-gray-400 hover:text-[#E43125]"
                        >
                          <RotateCcw size={11} aria-hidden />
                          Reset
                        </button>
                      )}
                    </label>
                    {field.hint && (
                      <p className="mb-1 text-xs text-gray-500">{field.hint}</p>
                    )}
                    {field.long ? (
                      <textarea
                        value={values[field.key]}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            [field.key]: e.target.value,
                          }))
                        }
                        rows={2}
                        placeholder={SITE_TEXT_DEFAULTS[field.key]}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    ) : (
                      <input
                        value={values[field.key]}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={SITE_TEXT_DEFAULTS[field.key]}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky so the button is reachable without scrolling back up after an
          edit near the bottom of a long form. */}
      <div className="sticky bottom-0 mt-5 flex items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-lg ring-1 ring-gray-200">
        <p className="text-sm text-gray-500">
          {dirty.length === 0
            ? "No changes"
            : `${dirty.length} change${dirty.length === 1 ? "" : "s"} not saved yet`}
        </p>
        <button
          onClick={save}
          disabled={isSaving || dirty.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c4291f] disabled:opacity-40"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          Save changes
        </button>
      </div>
    </div>
  );
};

export default SiteTextEditor;
