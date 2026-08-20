/**
 * Games and teams.
 *
 * The schedule comes out of TOSL as a spreadsheet. It is pasted into
 * Dashboard > Fixtures rather than scraped from the league's website: their
 * calendar page is served over plain HTTP and redirects HTTPS straight back to
 * HTTP, which no server-side fetch will follow, and their HTML would break the
 * first time they redesign. A seven-column export will not.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Team {
  id: number;
  ageGroup: string;
  displayName: string;
  leagueName: string;
  photoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Fixture {
  id: number;
  gameNumber: string | null;
  season?: string;
  /** The durable link to a team; survives the squad moving up an age group. */
  teamId: number | null;
  ageGroup: string;
  division: string;
  competition: string;
  /** Local Toronto wall-clock time, e.g. "2026-09-02T18:30:00.000Z". */
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

const get = async <T>(path: string, fallback: T): Promise<T> => {
  if (!API_URL) return fallback;
  try {
    const response = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return fallback;
    const data = await response.json();
    return (data ?? fallback) as T;
  } catch {
    // A page must never fail because the fixture list is unavailable.
    return fallback;
  }
};

export const getUpcomingFixtures = (limit?: number) =>
  get<Fixture[]>(`/fixtures${limit ? `?limit=${limit}` : ""}`, []);

export const getRecentFixtures = (limit = 8) =>
  get<Fixture[]>(`/fixtures/recent?limit=${limit}`, []);

export const getTeams = () => get<Team[]>("/fixtures/teams", []);

/**
 * The subscribable calendar feed.
 *
 * webcal:// rather than https:// so a tap on a phone offers to *subscribe*
 * rather than importing a one-off snapshot that never updates again. Falling
 * back to https for anything that does not understand it.
 */
export const calendarUrl = (ageGroup?: string): string => {
  const base = `${API_URL ?? ""}/fixtures/calendar.ics`;
  return ageGroup ? `${base}?ageGroup=${encodeURIComponent(ageGroup)}` : base;
};

export const calendarSubscribeUrl = (ageGroup?: string): string =>
  calendarUrl(ageGroup).replace(/^https?:\/\//, "webcal://");

/**
 * A single-event .ics for one game, built in the browser.
 *
 * Separate from the feed on purpose: a parent who wants one game in their
 * diary should not have to subscribe to every age group to get it.
 */
export const singleEventIcs = (
  fixture: Fixture,
  label: string
): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = kickoffDate(fixture.kickoff);
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const local = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(
      d.getHours()
    )}${pad(d.getMinutes())}00`;
  const esc = (v: string) =>
    (v ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  const title = `${label} ${fixture.isHome ? "vs" : "at"} ${fixture.opponent}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Excel Pro Soccer Academy//Fixture//EN",
    "BEGIN:VEVENT",
    `UID:fixture-${fixture.id}@excelproso.com`,
    `DTSTAMP:${local(new Date())}`,
    `DTSTART:${local(start)}`,
    `DTEND:${local(end)}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(fixture.venue || "To be confirmed")}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT12H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(title)} tomorrow`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
};

/** Triggers the browser download for a one-game .ics. */
export const downloadIcs = (fixture: Fixture, label: string): void => {
  const blob = new Blob([singleEventIcs(fixture, label)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `excel-pro-${fixture.ageGroup}-${fixture.opponent
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/* ---------------------------------------------------------------- display */

/**
 * The photo to show for a team.
 *
 * Falls back to the age-bracket image shipped with the site so a team with no
 * photo set never renders an empty box. Note that the bracket file for U9-U12
 * covers both the U10 and the U12 side — that shared picture is exactly why
 * the photo became editable in the first place.
 */
const BRACKET_PHOTO: { max: number; src: string }[] = [
  { max: 8, src: "/images/person/team/u7.webp" },
  { max: 12, src: "/images/person/team/u9-u12.webp" },
  { max: 14, src: "/images/person/team/u13-u14.jpeg" },
  { max: 99, src: "/images/person/team/u15-u18.jpeg" },
];

/**
 * Finds the team for a fixture.
 *
 * teamId first, age group only as a fallback. The squad that is U10 this
 * season is U11 the next, so matching on the label would show last season's
 * results under whichever team inherits the name.
 */
export const teamFor = (
  fixture: { teamId?: number | null; ageGroup: string },
  teams: Team[] = []
): Team | undefined =>
  (fixture.teamId != null
    ? teams.find((t) => t.id === fixture.teamId)
    : undefined) ?? teams.find((t) => t.ageGroup === fixture.ageGroup);

export const teamPhoto = (
  ageGroup: string,
  teams: Team[] = [],
  teamId?: number | null
): { src: string; remote: boolean } => {
  const team = teamFor({ teamId, ageGroup }, teams);
  if (team?.photoUrl) return { src: team.photoUrl, remote: true };
  const n = Number(String(ageGroup).replace(/\D/g, "")) || 99;
  const bracket =
    BRACKET_PHOTO.find((b) => n <= b.max) ??
    BRACKET_PHOTO[BRACKET_PHOTO.length - 1];
  return { src: bracket.src, remote: false };
};

export const teamName = (
  ageGroup: string,
  teams: Team[] = [],
  teamId?: number | null
): string =>
  teamFor({ teamId, ageGroup }, teams)?.displayName ||
  `Excel Pro NY ${ageGroup}`;

/**
 * Kick-off is stored without a timezone and must be read back without one.
 *
 * The backend saves the wall-clock numbers the league printed. Letting the
 * browser apply its own offset is how a 6:30pm game in Toronto shows as
 * 10:30pm to a parent whose phone is set to UTC.
 */
export const kickoffDate = (value: string): Date => {
  const m = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/
  );
  if (!m) return new Date(value);
  const [, y, mo, d, h, mi] = m;
  return new Date(+y, +mo - 1, +d, +h, +mi);
};

export const fixtureDay = (value: string): string =>
  kickoffDate(value)
    .toLocaleDateString("en-CA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    // en-CA renders "Sat, 22 Aug"; the comma reads as a stray keystroke once
    // the string sits inside a dot-separated line.
    .replace(",", "");

export const fixtureTime = (value: string): string =>
  kickoffDate(value)
    .toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    // "6:30 p.m." -> "6:30 pm", and a round hour loses its ":00".
    .replace(/\./g, "")
    .replace(":00", "")
    .toLowerCase()
    .trim();

/** "22" and "Aug" for the little date block on a fixture row. */
export const fixtureDayNumber = (value: string): string =>
  String(kickoffDate(value).getDate());

export const fixtureMonthShort = (value: string): string =>
  kickoffDate(value).toLocaleDateString("en-CA", { month: "short" });

/** "Today", "Tomorrow", "In 6 days" — whole days, ignoring the time. */
export const fixtureCountdown = (value: string): string => {
  const target = kickoffDate(value);
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const now = new Date();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((a.getTime() - b.getTime()) / 86400000);
  if (days < 0) return "";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `In ${days} days`;
  return "";
};

/** The soonest upcoming game for each team, that team's soonest first. */
export const nextPerTeam = (fixtures: Fixture[]): Fixture[] => {
  const byAge = new Map<string | number, Fixture>();
  for (const f of [...fixtures].sort(
    (a, b) => kickoffDate(a.kickoff).getTime() - kickoffDate(b.kickoff).getTime()
  )) {
    // Grouped by team, not by label, so a squad mid-rename does not appear
    // twice in the slideshow.
    const key = f.teamId ?? f.ageGroup;
    if (!byAge.has(key)) byAge.set(key, f);
  }
  // Array.from rather than spreading the iterator — the build targets ES5 and
  // spreading a Map iterator needs downlevelIteration.
  return Array.from(byAge.values());
};
