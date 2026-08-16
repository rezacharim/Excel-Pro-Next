/**
 * Coaches API, used from server components so the HTML that reaches a browser
 * (or Google, or WhatsApp's link scraper) already contains the real names and
 * photos. Fetching this on the client instead meant an edit made in the
 * dashboard did not appear in the page source at all.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CoachPhoto {
  url: string;
  caption?: string;
}

export interface ApiCoach {
  id: number;
  name: string;
  slug: string;
  role: string;
  bio: string | null;
  longBio: string | null;
  imageUrl: string | null;
  photos: CoachPhoto[] | null;
  sortOrder: number;
  isActive: boolean;
}

/**
 * No caching: the point of the dashboard is that a change is visible straight
 * away. This page is small and the academy's traffic is modest, so the cost of
 * asking the backend on every request is not worth a stale profile.
 */
const FETCH_OPTIONS: RequestInit = { cache: "no-store" };

/** Every visible coach, in display order. Empty array if the API is down. */
export async function getCoaches(): Promise<ApiCoach[]> {
  if (!API_URL) return [];
  try {
    const response = await fetch(`${API_URL}/coaches`, FETCH_OPTIONS);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** One coach by URL segment, or null when there is no such profile. */
export async function getCoachBySlug(slug: string): Promise<ApiCoach | null> {
  if (!API_URL) return null;
  try {
    const response = await fetch(
      `${API_URL}/coaches/by-slug/${encodeURIComponent(slug)}`,
      FETCH_OPTIONS
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data && typeof data === "object" && data.id ? data : null;
  } catch {
    return null;
  }
}
