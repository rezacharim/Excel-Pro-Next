"use client";

import { useState } from "react";
import { CalendarPlus, Check, Copy } from "lucide-react";
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
 * Offered per team as well as for everything, because a U10 parent does not
 * want fifteen U15 games filling up their week.
 */
const SubscribeCalendar = ({ teams }: { teams: Team[] }) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const copy = async () => {
    const url = calendarUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard permission can be refused, and on an insecure origin the API
      // is missing entirely. Showing the address is a fine fallback.
      window.prompt("Copy this calendar address", url);
    }
  };

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
          <p className="mb-3 text-sm text-gray-300">
            Subscribe once and the games appear in your phone&apos;s calendar —
            including any change the league makes later. Pick your child&apos;s
            team, or take the lot.
          </p>

          <div className="flex flex-wrap gap-2">
            <a
              href={calendarSubscribeUrl()}
              className="rounded-lg bg-[#E43125] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c4291f]"
            >
              All teams
            </a>
            {teams.map((t) => (
              <a
                key={t.id}
                href={calendarSubscribeUrl(t.ageGroup)}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20"
              >
                {t.ageGroup} only
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={copy}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 transition hover:text-white"
          >
            {copied ? (
              <>
                <Check size={13} aria-hidden /> Address copied
              </>
            ) : (
              <>
                <Copy size={13} aria-hidden /> Copy the address instead
              </>
            )}
          </button>

          <p className="mt-3 text-xs text-gray-400">
            On an iPhone the link opens straight in Calendar. On Android or a
            computer, copy the address and use &ldquo;From URL&rdquo; in Google
            Calendar.
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscribeCalendar;
