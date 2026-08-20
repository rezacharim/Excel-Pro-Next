import type { ReactNode } from "react";
import Link from "next/link";
import NewsSlider, { type NewsCard } from "./NewsSlider";
import { isRegistrationPost } from "@/services/news";
import { getSiteText } from "@/services/siteText";

const API = process.env.NEXT_PUBLIC_API_URL;

type AnnouncementCategory =
  | "league"
  | "trial"
  | "news"
  | "match"
  | "medal"
  | "interview";

interface Announcement {
  id: number;
  title: string;
  slug?: string | null;
  body: string;
  category: AnnouncementCategory;
  fullBody?: string | null;
  photos?: { url: string; caption?: string }[] | null;
  eventDate?: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Fallback image per category, used when a post has no photo of its own. A
 * picture is optional on purpose: requiring one every time is how a news
 * section quietly stops being updated.
 */
const CATEGORY: Record<
  AnnouncementCategory,
  { label: string; image: string; badge: string }
> = {
  league: {
    label: "League Registration",
    image: "/images/billboard/teams.webp",
    badge: "bg-[#E43125] text-white",
  },
  trial: {
    label: "Trials",
    image: "/images/billboard/Banner2.webp",
    badge: "bg-[#020022] text-white",
  },
  news: {
    label: "News",
    image: "/images/billboard/Banner3.webp",
    badge: "bg-gray-800 text-white",
  },
  match: {
    label: "Match Report",
    image: "/images/billboard/Banner3.webp",
    badge: "bg-[#020022] text-white",
  },
  medal: {
    label: "Awards",
    image: "/images/billboard/Banner2.webp",
    badge: "bg-amber-500 text-white",
  },
  interview: {
    label: "Interview",
    image: "/images/billboard/Banner3.webp",
    badge: "bg-emerald-600 text-white",
  },
};

const excerpt = (body: string, max = 150) => {
  // The first paragraph is the hook; the rest belongs on the full page.
  const first = body.split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
  return first.length > max ? `${first.slice(0, max).trimEnd()}…` : first;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

/** A post earns its own page once it has a full story or photos. */
const hasFullPost = (a: Announcement): boolean =>
  Boolean(
    a.slug &&
      ((a.fullBody ?? "").trim().length > 0 ||
        (a.photos ?? []).some((p) => p?.url))
  );

const getAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const res = await fetch(`${API}/announcements`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.filter((a) => a.isActive) : [];
  } catch {
    // The homepage must never fail because the news feed is unavailable.
    return [];
  }
};

/**
 * Home-page news. Fetched on the server so the headlines are in the HTML for
 * Google, then handed to a client component that slides through them.
 */
const LatestNews = async ({
  /**
   * Rendered in a column beside the stories — in practice the compact fixtures
   * card. Passed in from the page rather than fetched here so the fixtures and
   * the announcements load in parallel.
   */
  aside,
}: {
  aside?: ReactNode;
} = {}) => {
  const [all, text] = await Promise.all([getAnnouncements(), getSiteText()]);

  // Out of news but still in season: the fixtures card should not disappear
  // just because nobody has written a story lately.
  if (all.length === 0) {
    if (!aside) return null;
    return (
      <section className="mx-4 my-16 sm:my-24">
        <div className="mx-auto max-w-7xl lg:max-w-md lg:mx-auto">{aside}</div>
      </section>
    );
  }

  // Stories only. The hero above already carries league registration and
  // trials on its own slides, and showing the same Winter League notice twice
  // on one screen made the front page look like it had nothing else to say.
  // If there are no stories yet, fall back to everything rather than render
  // an empty section.
  const stories = all.filter((a) => !isRegistrationPost(a));
  const pool = stories.length > 0 ? stories : all;

  const items: NewsCard[] = [...pool]
    .sort(
      (a, b) =>
        new Date(b.eventDate || b.createdAt).getTime() -
        new Date(a.eventDate || a.createdAt).getTime()
    )
    .slice(0, 6)
    .map((a) => {
      const meta = CATEGORY[a.category] ?? CATEGORY.news;
      return {
        id: a.id,
        // A post with a page of its own wins; otherwise send them where the
        // announcement points, and failing that to the full list.
        href: hasFullPost(a)
          ? `/announcements/${a.slug}`
          : a.ctaUrl || "/announcements",
        title: a.title,
        excerpt: excerpt(a.body),
        // For a match report the date of the match matters more than the day
        // someone got round to writing it up.
        date: formatDate(a.eventDate || a.createdAt),
        image: a.imageUrl || meta.image,
        remoteImage: Boolean(a.imageUrl),
        badgeLabel: meta.label,
        badgeClass: meta.badge,
        ctaLabel: hasFullPost(a) ? "Read the full story" : a.ctaLabel,
      };
    });

  return (
    <section className="mx-4 my-16 sm:my-24">
      <div className="mx-auto max-w-7xl">
        {/* Stories take two thirds, the fixtures card the last third. On a
            phone they stack, news first — a parent scrolling the home page is
            more likely to be there for a headline than a kick-off time, and
            the kick-off times have their own page. */}
        <div
          className={
            aside ? "grid gap-8 lg:grid-cols-3 lg:items-start" : undefined
          }
        >
          <div className={aside ? "lg:col-span-2 min-w-0" : undefined}>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#E43125]">
                  {text["news.eyebrow"]}
                </p>
                <h2 className="text-3xl font-bold text-[#020022] sm:text-4xl">
                  {text["news.heading"]}
                </h2>
              </div>
              <Link
                href="/announcements"
                className="text-sm font-semibold text-[#E43125] hover:underline"
              >
                {text["news.link"]} →
              </Link>
            </div>

            <NewsSlider items={items} narrow={Boolean(aside)} />
          </div>

          {aside && <div className="min-w-0">{aside}</div>}
        </div>
      </div>
    </section>
  );
};

export default LatestNews;
