"use client";

import { useState } from "react";
import { CalendarPlus, Check, Copy, Download } from "lucide-react";
import {
  calendarSubscribeUrl,
  calendarUrl,
  type Team,
} from "@/services/fixtures";

/**
 * "Add these fixtures to your calendar."
 *
 * Subscribing beats downloading. A downloaded file is a snapshot: when the
 * league moves a Wednesday game to a Thursday — which happens most weeks — the
 * parent's diary still says Wednesday. A subscription re-checks on its own, so
 * a change made in the dashboard reaches every phone that took it.
 *
 * Every team therefore gets all three routes, because no single one works
 * everywhere:
 *
 *   Subscribe  webcal://  — one tap on a phone, but Chrome on Windows has
 *                           nothing registered for the scheme, so it fails
 *                           silently. Never the only option offered.
 *   Copy link  https://   — what Google Calendar's "From URL" and Outlook's
 *                           "Subscribe from web" actually want.
 *   Download   https://   — a one-off .ics for someone who just wants the
 *                           games in front of them now.
 *
 * Per team as well as for everything, because a U10 parent does not want
 * fifteen U15 games filling up their week.
 */
const SubscribeCalendar = ({ teams }: { teams: Team[] }) => {
  const [open, setOpen] = useState(false);
  // Keyed by age group ("" = all teams) so the tick appears on the row that
  // was actually copied rather than on all of them at once.
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = async (ageGroup?: string) => {
    const url = calendarUrl(ageGroup);
    const key = ageGroup ?? "";
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2500);
    } catch {
      // Clipboard permission can be refused, and on an insecure origin the API
      // is missing entirely. Showing the address is a fine fallback.
      window.prompt("Copy this calendar address", url);
    }
  };

  const rows: { key: string; label: string; ageGroup?: string }[] = [
    { key: "", label: "All teams" },
    ...teams.map((t) => ({
      key: t.ageGroup,
      label: t.displayName || `${t.ageGroup} only`,
      ageGroup: t.ageGroup,
    })),
  ];

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/15"
      >
        <CalendarPlus size={16} aria-hidden />
        Add these games to your calendar
      </button>

      {open && (
        <div className="mt-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="mb-4 text-sm text-gray-300">
            Pick your child&apos;s team. <strong>Subscribe</strong> keeps the
            games up to date by itself, including any change the league makes
            later — <strong>Download</strong> is a one-off snapshot.
          </p>

          <div className="space-y-2">
            {rows.map((row) => {
              const isAll = row.key === "";
              return (
                <div
                  key={row.key}
                  className={`flex flex-wrap items-center gap-2 rounded-lg p-2.5 ${
                    isAll ? "bg-white/10" : "bg-white/5"
                  }`}
                >
                  <span className="min-w-[7rem] flex-1 text-sm font-semibold text-white">
                    {row.label}
                  </span>

                  <a
                    href={calendarSubscribeUrl(row.ageGroup)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      isAll
                        ? "bg-[#E43125] text-white hover:bg-[#c4291f]"
                        : "bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25"
                    }`}
                  >
                    Subscribe
                  </a>

                  <button
                    type="button"
                    onClick={() => copy(row.ageGroup)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-300 ring-1 ring-white/20 transition hover:text-white"
                  >
                    {copiedKey === row.key ? (
                      <>
                        <Check size={12} aria-hidden /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} aria-hidden /> Copy link
                      </>
                    )}
                  </button>

                  <a
                    href={calendarUrl(row.ageGroup)}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-300 ring-1 ring-white/20 transition hover:text-white"
                  >
                    <Download size={12} aria-hidden />
                    Download
                  </a>
                </div>
              );
            })}
          </div>

          {/* Named by platform because "it did nothing when I clicked it" is
              almost always Subscribe on a desktop, and the fix is Copy link. */}
          <div className="mt-4 space-y-1 text-xs text-gray-400">
            <p>
              <strong className="text-gray-300">iPhone or iPad:</strong> tap
              Subscribe — it opens straight in Calendar.
            </p>
            <p>
              <strong className="text-gray-300">Google Calendar:</strong> Copy
              link, then Other calendars → + → From URL.
            </p>
            <p>
              <strong className="text-gray-300">Outlook:</strong> Copy link,
              then Add calendar → Subscribe from web.
            </p>
            <p className="pt-1">
              If Subscribe seems to do nothing, you are on a computer that has
              no calendar app set up for it — use Copy link instead.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscribeCalendar;
