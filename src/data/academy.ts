/**
 * The academy's age groups, training times and venue — ONE place.
 *
 * Every page that states an age group, a training day or where training
 * happens reads from here: /program, /program/[slug], /indoor, contact, the
 * register form, home-page metadata. Change a time here and the whole site
 * changes with it. Do not type these numbers anywhere else.
 *
 * `plan` is the internal membership key stored in the database. The keys
 * (U5_U8, U9_U12…) are historical and are NOT renamed — they are a Postgres
 * enum and TypeORM synchronize is live (see DANGER-typeorm-synchronize.md).
 * Only what parents read changes.
 */

export const VENUE = {
  name: "Richmond Hill Green Dome",
  street: "1300 Elgin Mills Rd E",
  city: "Richmond Hill",
  province: "ON",
  country: "CA",
  postalCode: "L4S 1M5",
  address: "1300 Elgin Mills Rd E, Richmond Hill, ON L4S 1M5",
  /** Richmond Green Sports Centre and Park, where the dome stands. */
  lat: 43.8984457,
  lng: -79.4013422,
  mapsUrl: "https://maps.app.goo.gl/e1kXXVNwyrk19dcm6",
} as const;

export const CURRENT_SEASON = {
  name: "Indoor Season 2026/27",
  startsOn: "October 5, 2026",
} as const;

/** Youngest and oldest ages the academy trains. */
export const AGE_RANGE = { min: 6, max: 18, text: "6 to 18", short: "6-18" } as const;

export type PlanKey = "U5_U8" | "U9_U12" | "U13_U14" | "U15_U18";

export interface Session {
  day: string;
  short: string;
  time: string;
}

export interface AcademyGroup {
  /** Value the indoor season API uses, e.g. "U6-U9" */
  key: string;
  /** What parents read, e.g. "U6 – U9" */
  label: string;
  /** Compact label, e.g. "U6–U9" */
  short: string;
  slug: string;
  plan: PlanKey;
  minAge: number;
  maxAge: number;
  sessions: Session[];
}

export const ACADEMY_GROUPS: AcademyGroup[] = [
  {
    key: "U6-U9",
    label: "U6 – U9",
    short: "U6–U9",
    slug: "u6-u9",
    plan: "U5_U8",
    minAge: 6,
    maxAge: 9,
    sessions: [
      { day: "Sunday", short: "Sun", time: "12–1 pm" },
      { day: "Wednesday", short: "Wed", time: "5–6 pm" },
    ],
  },
  {
    key: "U10-U12",
    label: "U10 – U12",
    short: "U10–U12",
    slug: "u10-u12",
    plan: "U9_U12",
    minAge: 10,
    maxAge: 12,
    sessions: [
      { day: "Sunday", short: "Sun", time: "1–2 pm" },
      { day: "Tuesday", short: "Tue", time: "5–6 pm" },
    ],
  },
  {
    key: "U13-U14",
    label: "U13 – U14",
    short: "U13–U14",
    slug: "u13-u14",
    plan: "U13_U14",
    minAge: 13,
    maxAge: 14,
    sessions: [
      { day: "Monday", short: "Mon", time: "5–6 pm" },
      { day: "Friday", short: "Fri", time: "5–6 pm" },
    ],
  },
  {
    key: "U15-U18",
    label: "U15 – U18",
    short: "U15–U18",
    slug: "u15-u18",
    plan: "U15_U18",
    minAge: 15,
    maxAge: 18,
    sessions: [
      { day: "Monday", short: "Mon", time: "5–6 pm" },
      { day: "Friday", short: "Fri", time: "5–6 pm" },
    ],
  },
];

const normKey = (v: string) =>
  (v || "").toUpperCase().replace(/\s+/g, "").replace(/[–—]/g, "-");

/** Finds a group from "U6-U9", "u6 – u9", "U6–U9"… */
export const groupByKey = (key: string) =>
  ACADEMY_GROUPS.find((g) => normKey(g.key) === normKey(key));

/** "Sunday 12–1 pm" lines for a group. */
export const scheduleLines = (g: AcademyGroup) =>
  g.sessions.map((s) => `${s.day} ${s.time}`);

/** "Sun 12–1 pm" lines for a group. */
export const shortScheduleLines = (g: AcademyGroup) =>
  g.sessions.map((s) => `${s.short} ${s.time}`);

/** Parent-facing label for a stored membership plan key. */
export const PLAN_LABELS: Record<PlanKey, string> = {
  U5_U8: "U6–U9",
  U9_U12: "U10–U12",
  U13_U14: "U13–U14",
  U15_U18: "U15–U18",
};

/** The plan a player of this age belongs to. */
export const planForAge = (age: number): PlanKey => {
  if (age <= 9) return "U5_U8";
  if (age <= 12) return "U9_U12";
  if (age <= 14) return "U13_U14";
  return "U15_U18";
};
