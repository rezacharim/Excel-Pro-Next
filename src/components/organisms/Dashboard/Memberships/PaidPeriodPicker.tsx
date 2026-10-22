"use client";

import { useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2 } from "lucide-react";

/**
 * One date picker for every "which dates did this family pay for?" question
 * on the Memberships screen — Record payment and Change paid dates.
 *
 * It used to be four different controls that each did dates their own way:
 * a "Covers N months" dropdown that silently added to whichever was later of
 * today or the old end date, a back-dating tick box, a separate "Edit
 * membership period" dialog, and "Extend by N days". The owner could not see
 * the period being saved until after saving it, and could not type a custom
 * end date when recording money at all.
 *
 * Now there are two questions, always in the same order:
 *   1. When does the paid period start?  (one tap for the usual answers,
 *      or any date)
 *   2. How long, or until when?          (1/2/3/6/12 months, or any date)
 * and a timeline underneath shows exactly what will be saved, against the
 * family's current period and today, with a warning for a gap or an overlap.
 */

// ---------------------------------------------------------------- date utils

/** "YYYY-MM-DD" for a local Date. */
export const toDay = (d: Date): string =>
  `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;

/**
 * Local calendar day of a stored timestamp. A plain date saved by the old
 * server code landed at exactly midnight UTC — the previous evening in
 * Toronto — so those are read by their UTC date, which is the day the owner
 * actually typed.
 */
export const dayOf = (value: string | null | undefined): string => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/T00:00:00(\.0+)?(Z|\+00:00)$/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : toDay(d);
};

/** Local Date from "YYYY-MM-DD", or null. */
export const fromDay = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
};

/** Jan 31 + 1 month = Feb 28/29, never Mar 3. */
export const addMonthsToDay = (day: string, months: number): string => {
  const d = fromDay(day);
  if (!d) return "";
  const first = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return toDay(new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), last)));
};

/** Whole days from a to b (b − a). */
export const daysBetween = (a: string, b: string): number | null => {
  const x = fromDay(a);
  const y = fromDay(b);
  if (!x || !y) return null;
  return Math.round((y.getTime() - x.getTime()) / 86400000);
};

export const todayDay = (): string => toDay(new Date());

/** "Oct 21" or, outside this year, "Oct 21, 2027". */
export const prettyDay = (day: string, withYear = false): string => {
  const d = fromDay(day);
  if (!d) return "—";
  const showYear = withYear || d.getFullYear() !== new Date().getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(showYear ? { year: "numeric" } : {}),
  });
};

/** Exact whole months from start to end, or null. */
export const exactMonths = (start: string, end: string): number | null => {
  const s = fromDay(start);
  const e = fromDay(end);
  if (!s || !e) return null;
  const m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return m > 0 && addMonthsToDay(start, m) === end ? m : null;
};

/** "2 months", "1 year" or "45 days". */
export const lengthText = (start: string, end: string): string => {
  const m = exactMonths(start, end);
  if (m) return m === 12 ? "1 year" : `${m} month${m === 1 ? "" : "s"}`;
  const days = daysBetween(start, end);
  if (days === null || days < 0) return "";
  return `${days} day${days === 1 ? "" : "s"}`;
};

/** Months to report to the server's old `months` field (1–12). */
export const approxMonths = (start: string, end: string): number => {
  const m = exactMonths(start, end);
  if (m) return Math.min(12, m);
  const days = daysBetween(start, end) ?? 60;
  return Math.max(1, Math.min(12, Math.round(days / 30.44)));
};

/**
 * Sensible first guess when recording money: carry straight on from the
 * current period if it hasn't run out, otherwise start on the day the money
 * arrived. Two months, the academy's standard.
 */
export const suggestedPeriod = (
  currentEnd: string | null,
  received: string
): { start: string; end: string } => {
  const end = dayOf(currentEnd);
  const start = end && end >= received ? end : received;
  return { start, end: addMonthsToDay(start, 2) };
};

// ------------------------------------------------------------------ component

const LENGTHS = [
  { months: 1, label: "1 month" },
  { months: 2, label: "2 months" },
  { months: 3, label: "3 months" },
  { months: 6, label: "6 months" },
  { months: 12, label: "1 year" },
];

interface Props {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  /** The family's current paid period, as stored. */
  currentStart?: string | null;
  currentEnd?: string | null;
  /** Day the money arrived, when recording a payment. */
  received?: string;
  /**
   * Correcting the current period rather than adding a new one: the start may
   * be left blank, and the old dates are shown as "was", not as a period the
   * new one could overlap.
   */
  startOptional?: boolean;
}

const chip = (active: boolean) =>
  `px-3 py-1.5 rounded-full border text-sm transition ${
    active
      ? "border-[#E43125] bg-red-50 text-[#E43125] font-semibold"
      : "border-gray-200 text-gray-700 hover:bg-gray-50"
  }`;

const PaidPeriodPicker = ({
  start,
  end,
  onChange,
  currentStart,
  currentEnd,
  received,
  startOptional,
}: Props) => {
  const today = todayDay();
  const curEnd = dayOf(currentEnd);
  const curStart = dayOf(currentStart);

  // Which length button is lit; null = a custom end date. The parent mounts a
  // fresh picker (via `key`) for each player, so this starts out right.
  const [months, setMonths] = useState<number | null>(() =>
    start && end ? exactMonths(start, end) : null
  );

  const setStart = (value: string) => {
    if (months && value) onChange(value, addMonthsToDay(value, months));
    else onChange(value, end);
  };
  const pickLength = (m: number) => {
    setMonths(m);
    onChange(start, addMonthsToDay(start || today, m));
  };
  const setEnd = (value: string) => {
    setMonths(start && value ? exactMonths(start, value) : null);
    onChange(start, value);
  };

  // Quick answers for "starts". Duplicate dates are folded together.
  const editing = !!startOptional;
  const startChips: { label: string; day: string }[] = [];
  if (editing && curStart) {
    startChips.push({ label: `Keep current start · ${prettyDay(curStart)}`, day: curStart });
  } else if (curEnd) {
    startChips.push({
      label:
        curEnd >= today
          ? `Carry on after current period · ${prettyDay(curEnd)}`
          : `From when they ran out · ${prettyDay(curEnd)}`,
      day: curEnd,
    });
  }
  if (received && received !== today) {
    startChips.push({ label: `Date received · ${prettyDay(received)}`, day: received });
  }
  startChips.push({ label: `Today · ${prettyDay(today)}`, day: today });
  const seen = new Set<string>();
  const uniqueChips = startChips.filter((c) => !seen.has(c.day) && seen.add(c.day));

  const backwards = !!start && !!end && start > end;
  const daysLeft = end ? daysBetween(today, end) : null;

  // Against the family's current period.
  let continuity: { tone: "ok" | "warn"; text: string } | null = null;
  if (!editing && start && curEnd && !backwards) {
    const diff = daysBetween(curEnd, start) ?? 0;
    if (diff === 0) {
      continuity = { tone: "ok", text: "Carries straight on from their current period — no days lost, none unpaid." };
    } else if (diff > 0 && curEnd >= today) {
      continuity = {
        tone: "warn",
        text: `Leaves ${diff} unpaid day${diff === 1 ? "" : "s"} between ${prettyDay(curEnd)} and ${prettyDay(start)}.`,
      };
    } else if (diff < 0 && curEnd >= today) {
      const n = -diff;
      continuity = {
        tone: "warn",
        text: `Starts ${n} day${n === 1 ? "" : "s"} before their current period ends — those ${n} already-paid day${n === 1 ? "" : "s"} would be paid for twice.`,
      };
    }
  }

  // ---- timeline geometry: from the earliest to the latest date shown.
  const points = [curStart, curEnd, start, end, today].filter(Boolean) as string[];
  const lo = points.reduce((a, b) => (a < b ? a : b), today);
  const hi = points.reduce((a, b) => (a > b ? a : b), today);
  const span = Math.max(1, daysBetween(lo, hi) ?? 1);
  const pos = (d: string) => `${(((daysBetween(lo, d) ?? 0) / span) * 100).toFixed(2)}%`;
  const width = (a: string, b: string) =>
    `${Math.max(1.5, ((daysBetween(a, b) ?? 0) / span) * 100).toFixed(2)}%`;

  return (
    <div className="space-y-4">
      {/* 1 — start */}
      <div>
        <p className="text-sm font-medium text-gray-800 mb-2">
          1. Paid period starts
          {startOptional && <span className="font-normal text-gray-500"> (optional)</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          {uniqueChips.map((c) => (
            <button key={c.day} type="button" onClick={() => setStart(c.day)} className={chip(start === c.day)}>
              {c.label}
            </button>
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <CalendarDays size={16} className="text-gray-400" />
          <span className="whitespace-nowrap">or any date</span>
          <input
            type="date"
            aria-label="Paid period starts"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="flex-1 min-w-0 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
          />
          {startOptional && start && (
            <button type="button" onClick={() => onChange("", end)} className="text-xs text-gray-500 underline">
              clear
            </button>
          )}
        </label>
      </div>

      {/* 2 — length / end */}
      <div>
        <p className="text-sm font-medium text-gray-800 mb-2">2. Paid for how long?</p>
        <div className="flex flex-wrap gap-2">
          {LENGTHS.map((l) => (
            <button key={l.months} type="button" onClick={() => pickLength(l.months)} className={chip(months === l.months)}>
              {l.label}
              {l.months === 2 && <span className="ml-1 text-xs font-normal text-gray-400">standard</span>}
            </button>
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <CalendarDays size={16} className="text-gray-400" />
          <span className="whitespace-nowrap">paid until</span>
          <input
            type="date"
            aria-label="Paid until"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className={`flex-1 min-w-0 px-3 py-1.5 border rounded-lg text-sm ${
              months === null && end ? "border-[#E43125]" : "border-gray-200"
            }`}
          />
        </label>
        {months === null && end && start && !backwards && (
          <p className="mt-1 text-xs text-gray-500">Custom end date · {lengthText(start, end)}</p>
        )}
      </div>

      {/* 3 — what will be saved */}
      <div aria-live="polite" className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        {backwards ? (
          <p className="flex items-start gap-2 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            The period cannot end before it starts. Please check the dates.
          </p>
        ) : !end ? (
          <p className="text-sm text-gray-500">Choose a paid-until date to see the result.</p>
        ) : (
          <>
            <p className="text-sm text-gray-800">
              <span className="font-semibold">
                {start ? `${prettyDay(start, true)} → ` : "Paid until "}
                {prettyDay(end, true)}
              </span>
              {start && <span className="text-gray-500"> · {lengthText(start, end)}</span>}
            </p>
            <p
              className={`mt-0.5 text-sm ${
                daysLeft !== null && daysLeft < 0 ? "text-red-700" : "text-green-700"
              }`}
            >
              {daysLeft === null
                ? ""
                : daysLeft < 0
                  ? `Will show as ${-daysLeft} day${daysLeft === -1 ? "" : "s"} overdue`
                  : daysLeft === 0
                    ? "Will show as due today"
                    : `Will show as Active · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
            </p>

            {/* timeline */}
            <div className="relative mt-4 mb-5 h-3 rounded-full bg-gray-200">
              {curEnd && !editing && (
                <div
                  title="Current period"
                  className="absolute top-0 h-3 rounded-full bg-gray-400"
                  style={{ left: pos(curStart && curStart < curEnd ? curStart : lo), width: width(curStart && curStart < curEnd ? curStart : lo, curEnd) }}
                />
              )}
              <div
                title="New paid period"
                className="absolute top-0 h-3 rounded-full bg-green-500/80 ring-1 ring-green-700/30"
                style={{ left: pos(start || lo), width: width(start || lo, end) }}
              />
              <div className="absolute -top-1 h-5 w-0.5 bg-[#020022]" style={{ left: pos(today) }} />
              <span className="absolute top-4 -translate-x-1/2 text-[10px] font-semibold text-[#020022]" style={{ left: pos(today) }}>
                today
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
              {curEnd && !editing && (
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-3 rounded bg-gray-400" /> current period (ends {prettyDay(curEnd)})
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-3 rounded bg-green-500" />{" "}
                {editing ? "paid period after saving" : "new paid period"}
              </span>
              {editing && (
                <span>
                  was {curStart ? `${prettyDay(curStart)} → ` : "paid until "}
                  {curEnd ? prettyDay(curEnd) : "not set"}
                </span>
              )}
            </div>

            {continuity && (
              <p
                className={`mt-3 flex items-start gap-2 text-sm ${
                  continuity.tone === "ok" ? "text-green-700" : "text-amber-700"
                }`}
              >
                {continuity.tone === "ok" ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                )}
                {continuity.text}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaidPeriodPicker;
