/**
 * ============================================================================
 *  THE ONE PLACE. Venue, season, age groups, training times, where to register.
 * ============================================================================
 *
 * The academy runs two seasons a year and they differ in where training
 * happens, which days, and how families register:
 *
 *   indoor  — Richmond Hill Green Dome, Oct → Apr, registration at /indoor
 *   outdoor — Ashton Meadows Park, Markham, spring/summer, registration at /register
 *
 * TO SWITCH SEASONS: change ACTIVE_SEASON below (one word), check that
 * season's block is right, upload. Every page follows: /program and each
 * program page, /indoor, Contact Us, Coaches, the register form's schedule,
 * the "Register for this program" button, page titles/descriptions for
 * Google, and the home page's business listing.
 *
 * Age groups are the same in both seasons. Only times and venue change.
 *
 * `plan` is the internal membership key stored in the database. The keys
 * (U5_U8, U9_U12…) are historical and are NOT renamed — they are a Postgres
 * enum and TypeORM synchronize is live (see DANGER-typeorm-synchronize.md).
 * Only what parents read changes.
 */

export type SeasonKey = "indoor" | "outdoor";

/** ◀◀ The switch. "indoor" from October, "outdoor" when the park season opens. */
export const ACTIVE_SEASON: SeasonKey = "indoor";

// ---------------------------------------------------------------------------

export type PlanKey = "U5_U8" | "U9_U12" | "U13_U14" | "U15_U18";

export interface Session {
  day: string;
  short: string;
  time: string;
}

export interface Venue {
  name: string;
  street: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  address: string;
  lat: number;
  lng: number;
  mapsUrl: string;
}

export interface Season {
  key: SeasonKey;
  name: string;
  /** Shown as "starts …". Human text on purpose, so "late April" is allowed. */
  startsOn: string;
  venue: Venue;
  /** Where every "Register" / "Reserve a spot" button goes this season. */
  registerPath: string;
  /** Training times per age group, keyed by AgeGroup.key. */
  sessions: Record<string, Session[]>;
  /** False until Reza has confirmed this block for the coming season. */
  confirmed: boolean;
}

export const SEASONS: Record<SeasonKey, Season> = {
  indoor: {
    key: "indoor",
    name: "Indoor Season 2026/27",
    startsOn: "October 5, 2026",
    registerPath: "/indoor",
    confirmed: true,
    venue: {
      name: "Richmond Hill Green Dome",
      street: "1300 Elgin Mills Rd E",
      city: "Richmond Hill",
      province: "ON",
      country: "CA",
      postalCode: "L4S 1M5",
      address: "1300 Elgin Mills Rd E, Richmond Hill, ON L4S 1M5",
      // Richmond Green Sports Centre and Park, where the dome stands.
      lat: 43.8984457,
      lng: -79.4013422,
      mapsUrl: "https://maps.app.goo.gl/e1kXXVNwyrk19dcm6",
    },
    sessions: {
      "U6-U9": [
        { day: "Sunday", short: "Sun", time: "12–1 pm" },
        { day: "Wednesday", short: "Wed", time: "5–6 pm" },
      ],
      "U10-U12": [
        { day: "Sunday", short: "Sun", time: "1–2 pm" },
        { day: "Tuesday", short: "Tue", time: "5–6 pm" },
      ],
      "U13-U14": [
        { day: "Monday", short: "Mon", time: "5–6 pm" },
        { day: "Friday", short: "Fri", time: "5–6 pm" },
      ],
      "U15-U18": [
        { day: "Monday", short: "Mon", time: "5–6 pm" },
        { day: "Friday", short: "Fri", time: "5–6 pm" },
      ],
    },
  },

  // Last summer's arrangement, kept so switching back is one word.
  // CONFIRM before switching: start date, times per group, exact address.
  outdoor: {
    key: "outdoor",
    name: "Outdoor Season 2027",
    startsOn: "late April 2027",
    registerPath: "/register",
    confirmed: false,
    venue: {
      name: "Ashton Meadows Park",
      // Address as posted in the academy's own "Schedule Update" notice.
      street: "202 Calvert Rd",
      city: "Markham",
      province: "ON",
      country: "CA",
      postalCode: "",
      address: "202 Calvert Rd, Markham, ON",
      lat: 43.8887,
      lng: -79.3537,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ashton+Meadows+Park,+202+Calvert+Rd,+Markham,+ON",
    },
    sessions: {
      "U6-U9": [
        { day: "Monday", short: "Mon", time: "5–6:30 pm" },
        { day: "Wednesday", short: "Wed", time: "5–6:30 pm" },
      ],
      "U10-U12": [
        { day: "Monday", short: "Mon", time: "5–6:30 pm" },
        { day: "Wednesday", short: "Wed", time: "5–6:30 pm" },
      ],
      "U13-U14": [
        { day: "Monday", short: "Mon", time: "6:30–8 pm" },
        { day: "Wednesday", short: "Wed", time: "6:30–8 pm" },
      ],
      "U15-U18": [
        { day: "Monday", short: "Mon", time: "6:30–8 pm" },
        { day: "Wednesday", short: "Wed", time: "6:30–8 pm" },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Age groups — the same all year.

interface AgeGroupDef {
  /** Value the season API uses, e.g. "U6-U9" */
  key: string;
  /** What parents read, e.g. "U6 – U9" */
  label: string;
  /** Compact label, e.g. "U6–U9" */
  short: string;
  slug: string;
  plan: PlanKey;
  minAge: number;
  maxAge: number;
}

const AGE_GROUP_DEFS: AgeGroupDef[] = [
  { key: "U6-U9", label: "U6 – U9", short: "U6–U9", slug: "u6-u9", plan: "U5_U8", minAge: 6, maxAge: 9 },
  { key: "U10-U12", label: "U10 – U12", short: "U10–U12", slug: "u10-u12", plan: "U9_U12", minAge: 10, maxAge: 12 },
  { key: "U13-U14", label: "U13 – U14", short: "U13–U14", slug: "u13-u14", plan: "U13_U14", minAge: 13, maxAge: 14 },
  { key: "U15-U18", label: "U15 – U18", short: "U15–U18", slug: "u15-u18", plan: "U15_U18", minAge: 15, maxAge: 18 },
];

/** Youngest and oldest ages the academy trains. */
export const AGE_RANGE = { min: 6, max: 18, text: "6 to 18", short: "6-18" } as const;

// ---------------------------------------------------------------------------
// What the rest of the site reads. Everything below follows ACTIVE_SEASON.

export const CURRENT_SEASON: Season = SEASONS[ACTIVE_SEASON];
export const VENUE: Venue = CURRENT_SEASON.venue;
export const REGISTER_PATH = CURRENT_SEASON.registerPath;

export interface AcademyGroup extends AgeGroupDef {
  sessions: Session[];
}

export const ACADEMY_GROUPS: AcademyGroup[] = AGE_GROUP_DEFS.map((g) => ({
  ...g,
  sessions: CURRENT_SEASON.sessions[g.key] ?? [],
}));

const normKey = (v: string) =>
  (v || "").toUpperCase().replace(/\s+/g, "").replace(/[–—]/g, "-");

/** Finds a group from "U6-U9", "u6 – u9", "U6–U9", "u6-u9"… */
export const groupByKey = (key: string) =>
  ACADEMY_GROUPS.find((g) => normKey(g.key) === normKey(key));

/** "Sunday 12–1 pm" lines for a group. */
export const scheduleLines = (g: AcademyGroup) =>
  g.sessions.map((s) => `${s.day} ${s.time}`);

/** "Sun 12–1 pm" lines for a group. */
export const shortScheduleLines = (g: AcademyGroup) =>
  g.sessions.map((s) => `${s.short} ${s.time}`);

/** "Sun 12–1 pm & Wed 5–6 pm" — for meta descriptions. */
export const scheduleSentence = (g: AcademyGroup) =>
  shortScheduleLines(g).join(" & ");

/** Where to send a family who wants a particular group this season. */
export const registerHref = (g?: AcademyGroup) =>
  g && REGISTER_PATH === "/indoor"
    ? `${REGISTER_PATH}?group=${encodeURIComponent(g.key)}`
    : REGISTER_PATH;

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
