import Image from "next/image";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

type AnnouncementCategory = "league" | "trial" | "news";

interface Announcement {
  id: number;
  title: string;
  body: string;
  category: AnnouncementCategory;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Fallback image per category, used when an announcement has no photo of
 * its own. A picture is optional on purpose: requiring one every time is how
 * a news section quietly stops being updated.
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

const LatestNews = async () => {
  const all = await getAnnouncements();
  if (all.length === 0) return null;

  // League and trials outrank general news — they are the ones with a deadline.
  const rank: Record<AnnouncementCategory, number> = {
    league: 0,
    trial: 1,
    news: 2,
  };
  const items = [...all]
    .sort(
      (a, b) =>
        rank[a.category] - rank[b.category] ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => {
            const meta = CATEGORY[a.category] ?? CATEGORY.news;
            return (
              <article
                key={a.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:shadow-lg"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={a.imageUrl || meta.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    unoptimized={Boolean(a.imageUrl)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <span
                    className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${meta.badge}`}
                  >
                    {meta.label}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs text-gray-500">
                    {formatDate(a.createdAt)}
                  </p>
                  <h3 className="mt-2 text-lg font-bold leading-snug text-[#020022]">
                    {a.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">
                    {excerpt(a.body)}
                  </p>

                  <div className="mt-5">
                    {a.ctaUrl ? (
                      <Link
                        href={a.ctaUrl}
                        className="inline-block rounded-lg bg-[#E43125] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c4291f]"
                      >
                        {a.ctaLabel || "Read more"}
                      </Link>
                    ) : (
                      <Link
                        href="/announcements"
                        className="text-sm font-semibold text-[#E43125] hover:underline"
                      >
                        Read more →
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LatestNews;
