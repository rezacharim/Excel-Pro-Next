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
 * A post is worth its own page once it has a full story or photos. A one-line
 * registration notice is not — linking to a page that just repeats the card
 * wastes the reader's click.
 */
export const hasFullPost = (post: {
  slug?: string | null;
  fullBody?: string | null;
  photos?: PostPhoto[] | null;
}): boolean =>
  Boolean(
    post.slug &&
      ((post.fullBody ?? "").trim().length > 0 ||
        (post.photos ?? []).some((p) => p?.url))
  );

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
