/**
 * Turns rows copied out of a TOSL schedule spreadsheet into fixtures.
 *
 * The league exports seven columns:
 *
 *   Game Number | Division | Game Date | Kick Off | Home Team | Away Team | Field
 *
 * Pasting is deliberately the input rather than a file upload. Reading .xlsx
 * needs a parser library, a new dependency means regenerating the lockfile,
 * and a stale lockfile fails the Vercel build in five seconds while quietly
 * leaving the old deployment live. Copying rows out of Excel gives
 * tab-separated text that plain JavaScript can read, with nothing to install.
 */

export interface ParsedFixture {
  gameNumber: string;
  ageGroup: string;
  division: string;
  competition: string;
  /** "YYYY-MM-DD HH:mm", local time exactly as the league printed it. */
  kickoff: string;
  opponent: string;
  isHome: boolean;
  venue: string;
}

export interface ParseResult {
  fixtures: ParsedFixture[];
  /** Rows that could not be read, with the reason, so nothing fails silently. */
  problems: { line: number; text: string; reason: string }[];
  /** Games appearing more than once in the same paste. */
  duplicates: number;
}

/** Strips the league's team code: "USC Karpaty BU13T2 TOSL" -> "USC Karpaty". */
export const cleanTeamName = (raw: string): string =>
  (raw || "")
    .trim()
    // "BU13T2 TOSL", "GU10T3", "BU15D2" — the code, optionally with the
    // competition after it.
    .replace(/\s+[BG]U\d{1,2}[TD]\d+(\s+TOSL)?$/i, "")
    .replace(/\s+TOSL$/i, "")
    .trim();

/** "Boys Under 13 Tier 2/Tier 3" -> "U13". */
export const ageFromDivision = (division: string): string => {
  const m = (division || "").match(/Under\s*(\d{1,2})/i);
  return m ? `U${m[1]}` : "";
};

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * Reads a date cell.
 *
 * Excel hands over whatever the machine's locale produced, so this accepts the
 * ISO form the export uses plus the two North American shapes a copy-paste can
 * turn it into. Two-digit years are treated as 2000s — this is a youth fixture
 * list, not a historical archive.
 */
const parseDate = (raw: string): { y: number; m: number; d: number } | null => {
  const s = (raw || "").trim().split(/[T ]/)[0];
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return { y: +m[1], m: +m[2], d: +m[3] };

  // 8/29/2026 or 08-29-26 — month first, which is how Excel writes it here.
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    return { y, m: +m[1], d: +m[2] };
  }

  // 29-Aug-2026 / Aug 29 2026
  m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{4})$/);
  if (m && MONTHS[m[2].slice(0, 3).toLowerCase()]) {
    return { y: +m[3], m: MONTHS[m[2].slice(0, 3).toLowerCase()], d: +m[1] };
  }
  m = s.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m && MONTHS[m[1].slice(0, 3).toLowerCase()]) {
    return { y: +m[3], m: MONTHS[m[1].slice(0, 3).toLowerCase()], d: +m[2] };
  }
  return null;
};

/** "6:30 PM" -> { h: 18, mi: 30 }. Also takes "18:30" and "6 PM". */
const parseTime = (raw: string): { h: number; mi: number } | null => {
  const s = (raw || "").trim().replace(/ /g, " ");
  if (!s) return null;
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp])?\.?[Mm]?\.?$/);
  if (!m) return null;
  let h = +m[1];
  const mi = m[2] ? +m[2] : 0;
  const suffix = m[3]?.toLowerCase();
  if (suffix === "p" && h < 12) h += 12;
  if (suffix === "a" && h === 12) h = 0;
  if (h > 23 || mi > 59) return null;
  return { h, mi };
};

const pad = (n: number) => String(n).padStart(2, "0");

/** A field the league has not decided yet is stored empty, not as its text. */
const cleanVenue = (raw: string): string => {
  const v = (raw || "").trim();
  return /^to\s*be\s*(determined|announced|confirmed)$/i.test(v) || v === "TBD"
    ? ""
    : v;
};

const splitRow = (line: string): string[] =>
  // Tab is what copying from Excel gives. Comma is the fallback for someone
  // who saved as CSV instead — but only when there are no tabs at all, or a
  // venue like "Centennial Park 2, Etobicoke" would split itself in half.
  line.includes("\t")
    ? line.split("\t").map((c) => c.trim())
    : line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

/**
 * @param text      Rows copied from the spreadsheet. A header row is optional.
 * @param ourNames  How our own club is written in the league's file. Used to
 *                  decide home or away. Matched loosely so "NY Hearts A
 *                  BU13T2 TOSL" is found by "NY Hearts".
 */
export const parseSchedule = (
  text: string,
  ourNames: string[]
): ParseResult => {
  const needles = [...ourNames, "NY Hearts", "Excel Pro"]
    .map((n) => (n || "").trim().toLowerCase())
    .filter(Boolean)
    // Longest first so a specific name wins over a loose one.
    .sort((a, b) => b.length - a.length);

  const isOurs = (cell: string) => {
    const c = (cell || "").toLowerCase();
    return needles.some((n) => c.includes(n) || n.includes(c.trim()));
  };

  const fixtures: ParsedFixture[] = [];
  const problems: ParseResult["problems"] = [];
  const seen = new Set<string>();
  let duplicates = 0;

  const lines = (text || "").split(/\r?\n/);

  lines.forEach((line, i) => {
    if (!line.trim()) return;
    const cells = splitRow(line);
    // Header row, in whatever order the league writes it.
    if (/game\s*number/i.test(cells[0] ?? "")) return;
    if (cells.length < 6) {
      problems.push({
        line: i + 1,
        text: line.slice(0, 80),
        reason: `only ${cells.length} columns — expected 7`,
      });
      return;
    }

    const [num, division, dateCell, timeCell, home, away, field] = cells;
    const date = parseDate(dateCell);
    if (!date) {
      problems.push({
        line: i + 1,
        text: line.slice(0, 80),
        reason: `could not read the date "${dateCell}"`,
      });
      return;
    }
    const time = parseTime(timeCell);
    if (!time) {
      problems.push({
        line: i + 1,
        text: line.slice(0, 80),
        reason: `could not read the kick-off "${timeCell}"`,
      });
      return;
    }

    const weAreHome = isOurs(home);
    const weAreAway = isOurs(away);
    if (!weAreHome && !weAreAway) {
      problems.push({
        line: i + 1,
        text: line.slice(0, 80),
        reason: `neither team looks like ours — "${home}" v "${away}"`,
      });
      return;
    }
    if (weAreHome && weAreAway) {
      problems.push({
        line: i + 1,
        text: line.slice(0, 80),
        reason: "both teams match our name",
      });
      return;
    }

    const key = (num || "").trim() || `${dateCell}|${home}|${away}`;
    if (seen.has(key)) {
      duplicates += 1;
      return;
    }
    seen.add(key);

    fixtures.push({
      gameNumber: (num || "").trim(),
      ageGroup: ageFromDivision(division),
      division: (division || "").trim(),
      competition: "TOSL",
      kickoff: `${date.y}-${pad(date.m)}-${pad(date.d)} ${pad(time.h)}:${pad(
        time.mi
      )}`,
      opponent: cleanTeamName(weAreHome ? away : home),
      isHome: weAreHome,
      venue: cleanVenue(field),
    });
  });

  fixtures.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  return { fixtures, problems, duplicates };
};
