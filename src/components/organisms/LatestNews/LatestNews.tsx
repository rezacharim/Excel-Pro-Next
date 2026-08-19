import Link from "next/link";
import NewsSlider, { type NewsCard } from "./NewsSlider";

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
const LatestNews = async () => {
  const all = await getAnnouncements();
  if (all.length === 0) return null;

  // League and trials outrank the rest — they are the ones with a deadline.
  const rank: Record<AnnouncementCategory, number> = {
    league: 0,
    trial: 1,
    news: 2,
    match: 3,
    medal: 3,
    interview: 3,
  };

  const items: NewsCard[] = [...all]
    .sort(
      (a, b) =>
        rank[a.category] - rank[b.category] ||
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
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#E43125]">
              What&apos;s happening
            </p>
            <h2 className="text-3xl font-bold text-[#020022] sm:text-4xl">
              Latest news &amp; registration
            </h2>
          </div>
          <Link
            href="/announcements"
            className="text-sm font-semibold text-[#E43125] hover:underline"
          >
            See all news &amp; trials →
          </Link>
        </div>

        <NewsSlider items={items} />
      </div>
    </section>
  );
};

export default LatestNews;
