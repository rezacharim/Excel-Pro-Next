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
  /**
   * The real first day as "YYYY-MM-DD", or null while it is only "late April".
   * Once this date has passed every page stops saying "starts October 5" —
   * parents read a date in the past as "too late to join" — and says the
   * season is under way and new players are still welcome instead.
   */
  startsOnIso: string | null;
  venue: Venue;
  /** Where every "Register" / "Reserve a spot" button goes this season. */
  registerPath: string;
  /** Training times per age group, keyed by AgeGroup.key. */
  sessions: Record<string, Session[]>;
  /** False until Reza has confirmed this block for the coming season. */
  confirmed: boolean;
  /**
   * What a family pays to join this season, shown under the $380 / 2 months
   * price on /program. Without it a new parent read "$380 + $75 uniform" there
   * and then met $835 on the registration page. Leave out when it is simply
   * the regular fee.
   */
  joinLine?: string;
}

export const SEASONS: Record<SeasonKey, Season> = {
  indoor: {
    key: "indoor",
    name: "Indoor Season 2026/27",
    startsOn: "October 5, 2026",
    startsOnIso: "2026-10-05",
    registerPath: "/indoor",
    confirmed: true,
    // Confirmed by Reza 2026-10-21: the same at any point in the season, paid
    // in full before the player's first session.
    joinLine:
      "Joining the indoor season as a new player: $835 — first 2 months $380 + March & April $380 + uniform $75, paid before the first session. Already training with us: $380 for March & April.",
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
    startsOnIso: null,
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

/** True once the season's first day has begun (local time). */
export const seasonHasStarted = (
  season: Season = CURRENT_SEASON,
  now: Date = new Date()
): boolean =>
  !!season.startsOnIso &&
  now.getTime() >= new Date(`${season.startsOnIso}T00:00:00`).getTime();

/**
 * The season's timing as parents should read it today.
 *   before: "starts October 5, 2026"
 *   after:  "under way since October 5 — new players can join any time"
 * Pages built ahead of time recompute this on every deploy, and the pages that
 * show it are re-generated hourly, so the wording flips on its own.
 */
export const seasonTimingText = (
  season: Season = CURRENT_SEASON,
  now: Date = new Date()
): string => {
  if (!seasonHasStarted(season, now)) return `starts ${season.startsOn}`;
  const since = new Date(`${season.startsOnIso}T00:00:00`).toLocaleDateString(
    "en-CA",
    { month: "long", day: "numeric" }
  );
  return `under way since ${since} — new players can join any time`;
};
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

// ---------------------------------------------------------------------------
// Programs that sit on top of the season.

/**
 * Winter League (PISL / YRSL, /league). Off from 2026-10-23 at Reza's request:
 * /league stops taking new players (families already registered can still
 * sign in there to see and pay their balance), and the league slide, the
 * league notices and every "Register for Winter League" link come off the
 * public site. Set to true for the next league season.
 */
export const WINTER_LEAGUE_OPEN = false;

/**
 * I-Model team: a selective group, U13 to U16, trained through the winter at
 * the Green Dome to compete in the summer I-Model League. Trialists join a
 * regular indoor session of their age group, free, and coaches select from
 * there. Bookings go to Dashboard → Trials.
 */
export const IMODEL = {
  open: true,
  name: "I-Model Team",
  league: "Summer I-Model League",
  ages: ["U13", "U14", "U15", "U16"],
  agesText: "U13 to U16",
  /** Which indoor training group each I-Model age trains with. */
  trainsWith: { U13: "U13-U14", U14: "U13-U14", U15: "U15-U18", U16: "U15-U18" } as Record<string, string>,
  /**
   * Summer 2027 fee, confirmed by Reza 2026-10-28: $1,200, or $1,050 early
   * bird when paid in full by January 31, 2027. Shown on /trials. The amounts
   * actually charged come from the I-Model season in Dashboard → League →
   * Season settings — change both together.
   */
  fee: 1200,
  earlyBird: 1050,
  earlyBirdBy: "2027-01-31",
  /** Where a family offered a spot registers (personal link from the email). */
  registerPath: "/imodel",
} as const;

/** A free first session at a regular training — any age the academy trains. */
export const FREE_SESSION = { open: true } as const;

/** Where both trial kinds are booked. */
export const TRIALS_PATH = "/trials";

/** The indoor sessions a trialist of this group could come to. */
export const trialSessionsFor = (groupKey: string): Session[] =>
  SEASONS.indoor.sessions[groupKey] ?? [];

// ---------------------------------------------------------------------------
// WhatsApp and "bring a friend".

/**
 * The academy's WhatsApp number, digits only with country code — the same
 * line as the phone number on the site. Change it here if WhatsApp runs on a
 * different number.
 */
export const WHATSAPP_NUMBER = "16477037821";

/** A wa.me link that opens a chat with the academy, message pre-typed. */
export const whatsappHref = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/** A wa.me link that lets a parent pick a contact and send them a message. */
export const whatsappShareHref = (message: string) =>
  `https://wa.me/?text=${encodeURIComponent(message)}`;

/**
 * Referral program (Reza, 2026-10-28): a family that brings a friend or
 * relative who registers and pays for the Indoor Season earns a private
 * session with Coach Reza Abedian at his private gym (one-on-one or a small
 * group; date and time arranged with the family) — one per friend.
 */
export const REFERRAL = {
  open: true,
  coach: "Coach Reza Abedian",
  reward: "a private training session with Coach Reza Abedian",
  where: "at his private gym — one-on-one or in a small group, on a date and time arranged with you",
} as const;

/**
 * The link a current family shares. `ref` is one of their player ids: it
 * carries no name, so nothing personal is in the URL. It goes to /indoor —
 * registration is what earns the reward — and the id is remembered for 60
 * days, so a friend who books a free session first and registers later
 * still counts.
 */
export const friendInviteUrl = (playerId: number) =>
  `https://www.excelproso.com/indoor?src=friend&ref=${playerId}`;

/** Free-session version of the same link, for friends who want to try first. */
export const friendTrialUrl = (playerId: number) =>
  `https://www.excelproso.com${TRIALS_PATH}?for=free&src=friend&ref=${playerId}`;

const REF_KEY = "ep_ref";
const REF_DAYS = 60;

/** Remember ?ref= from any page. Never throws. */
export const rememberReferral = (search: string) => {
  try {
    const ref = Number(new URLSearchParams(search).get("ref"));
    if (Number.isInteger(ref) && ref > 0) {
      localStorage.setItem(REF_KEY, JSON.stringify({ ref, at: Date.now() }));
    }
  } catch {
    /* storage blocked — the URL still carries it on that page */
  }
};

/** The referring player id from the URL, or remembered within 60 days. */
export const currentReferral = (search: string): number | null => {
  const fromUrl = Number(new URLSearchParams(search).get("ref"));
  if (Number.isInteger(fromUrl) && fromUrl > 0) return fromUrl;
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const { ref, at } = JSON.parse(raw) as { ref: number; at: number };
    if (Date.now() - at > REF_DAYS * 86_400_000) return null;
    return Number.isInteger(ref) && ref > 0 ? ref : null;
  } catch {
    return null;
  }
};
