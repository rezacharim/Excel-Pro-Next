/**
 * Wording on the public site that the academy can change themselves.
 *
 * Headings like "Latest from our Instagram" used to be written into the
 * components, so rewording one sentence meant a code change and a deploy.
 * They come from the dashboard now — Settings > Website text.
 *
 * The defaults below are the wording that shipped. They are used whenever the
 * API is unreachable, and whenever a field has been left blank, so the site
 * always reads properly and clearing a box restores the original line.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type SiteTextKey =
  | "instagram.eyebrow"
  | "instagram.heading"
  | "instagram.blurb"
  | "instagram.handle"
  | "instagram.url"
  | "news.eyebrow"
  | "news.heading"
  | "news.link"
  | "fixtures.eyebrow"
  | "fixtures.heading"
  | "fixtures.upcoming"
  | "testimonials.eyebrow"
  | "testimonials.heading";

export type SiteText = Record<SiteTextKey, string>;

export const SITE_TEXT_DEFAULTS: SiteText = {
  "instagram.eyebrow": "Follow our journey",
  "instagram.heading": "Latest from our Instagram",
  "instagram.blurb": "Training sessions, match days and player moments —",
  "instagram.handle": "@ExcelProSoccer",
  "instagram.url": "https://www.instagram.com/excelprosoccer",
  "news.eyebrow": "What's happening",
  "news.heading": "Latest from the academy",
  "news.link": "See all news & registration",
  "fixtures.eyebrow": "Matchday",
  "fixtures.heading": "Next game",
  "fixtures.upcoming": "Coming up",
  "testimonials.eyebrow": "In their words",
  "testimonials.heading": "What our families say",
};

/**
 * Which fields belong together on the dashboard screen, and what to call them
 * for somebody who has never seen the code.
 */
export const SITE_TEXT_GROUPS: {
  title: string;
  note: string;
  fields: { key: SiteTextKey; label: string; hint?: string; long?: boolean }[];
}[] = [
  {
    title: "Instagram section",
    note: "The photo wall near the bottom of the home page.",
    fields: [
      { key: "instagram.eyebrow", label: "Small label above the heading" },
      { key: "instagram.heading", label: "Heading" },
      {
        key: "instagram.blurb",
        label: "Sentence under the heading",
        hint: "The handle is added on the end automatically, as a link.",
        long: true,
      },
      { key: "instagram.handle", label: "Handle shown" },
      { key: "instagram.url", label: "Link it opens" },
    ],
  },
  {
    title: "News section",
    note: "Directly under the banner on the home page.",
    fields: [
      { key: "news.eyebrow", label: "Small label above the heading" },
      { key: "news.heading", label: "Heading" },
      { key: "news.link", label: "Link on the right" },
    ],
  },
  {
    title: "Fixtures section",
    note: "The next-game card and the list of upcoming games.",
    fields: [
      { key: "fixtures.eyebrow", label: "Small label above the heading" },
      { key: "fixtures.heading", label: "Heading" },
      { key: "fixtures.upcoming", label: "Heading over the list" },
    ],
  },
  {
    title: "Testimonials section",
    note: "What parents and players say.",
    fields: [
      { key: "testimonials.eyebrow", label: "Small label above the heading" },
      { key: "testimonials.heading", label: "Heading" },
    ],
  },
];

/** Server-side read, for pages rendered on the server. */
export async function getSiteText(): Promise<SiteText> {
  if (!API_URL) return { ...SITE_TEXT_DEFAULTS };
  try {
    const res = await fetch(`${API_URL}/site-text`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { ...SITE_TEXT_DEFAULTS };
    const data = await res.json();
    return { ...SITE_TEXT_DEFAULTS, ...(data ?? {}) };
  } catch {
    return { ...SITE_TEXT_DEFAULTS };
  }
}

/** Browser read, for the client components that need it. */
export async function fetchSiteText(): Promise<SiteText> {
  if (!API_URL) return { ...SITE_TEXT_DEFAULTS };
  try {
    const res = await fetch(`${API_URL}/site-text`);
    if (!res.ok) return { ...SITE_TEXT_DEFAULTS };
    const data = await res.json();
    return { ...SITE_TEXT_DEFAULTS, ...(data ?? {}) };
  } catch {
    return { ...SITE_TEXT_DEFAULTS };
  }
}
