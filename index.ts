/**
 * Announcements and academy news.
 *
 * Fetched from server components so a post's title and text are in the HTML
 * itself — which is what Google indexes and what WhatsApp reads when a parent
 * shares a match report.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type PostCategory =
  | "league"
  | "trial"
  | "news"
  | "match"
  | "medal"
  | "interview";

export interface PostPhoto {
  url: string;
  caption?: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string | null;
  body: string;
  category: PostCategory;
  fullBody: string | null;
  photos: PostPhoto[] | null;
  eventDate: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Every post with a slug has a page.
 *
 * This used to also require a `fullBody` or photos, which quietly excluded
 * every notice written entirely in the short `body` field — the Winter League
 * and Indoor posts among them. Those are the longest posts on the site, and
 * the only place their text could appear was in full on the listing page,
 * which is what made that page unreadable. Now they get a page like anything
 * else and the card shows an excerpt.
 */
export const hasFullPost = (post: { slug?: string | null }): boolean =>
  Boolean(post.slug);

/**
 * Is this post a thing to DO rather than a thing to READ?
 *
 * Category alone is not enough. The Indoor Season notice is filed under
 * "news" because there is no Indoor category, but it is a registration notice
 * with a "Reserve your spot" button on it — and treating it as a story put it
 * in the home page news slider next to match reports. The button gives it
 * away, so the button is what we check.
 */
export const isRegistrationPost = (post: {
  category?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}): boolean => {
  if (post.category === "league" || post.category === "trial") return true;
  // A match report, an award or an interview is a story, full stop. The live
  // U13 report carries a "Register Now" button at the bottom — which is good
  // marketing and must not turn the report itself into a registration notice.
  if (["match", "medal", "interview"].includes(post.category ?? "")) {
    return false;
  }
  return Boolean(
    post.ctaUrl && /regist|reserv|sign.?up|book/i.test(post.ctaLabel ?? "")
  );
};

/**
 * The text to render on a post's own page.
 *
 * Prefers the long-form story, falls back to the short body. Without the
 * fallback an older notice would open to a page with a headline and nothing
 * underneath it.
 */
export const postStory = (post: {
  fullBody?: string | null;
  body?: string | null;
}): string => {
  const full = (post.fullBody ?? "").trim();
  return full.length > 0 ? full : (post.body ?? "").trim();
};

/** No caching: an edit in the dashboard should be visible immediately. */
const FETCH_OPTIONS: RequestInit = { cache: "no-store" };

export async function getPosts(): Promise<Post[]> {
  if (!API_URL) return [];
  try {
    const response = await fetch(`${API_URL}/announcements`, FETCH_OPTIONS);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!API_URL) return null;
  try {
    const response = await fetch(
      `${API_URL}/announcements/by-slug/${encodeURIComponent(slug)}`,
      FETCH_OPTIONS
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data && typeof data === "object" && data.id ? data : null;
  } catch {
    return null;
  }
}

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  league: "League Registration",
  trial: "Trials",
  news: "News",
  match: "Match Report",
  medal: "Awards",
  interview: "Interview",
};

/** A date a parent reads at a glance, not an ISO string. */
export const formatPostDate = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
