"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { RefreshCw, XCircle, ArrowRight, ChevronDown } from "lucide-react";
import { isRegistrationPost } from "@/services/news";
import Story from "@/components/molecules/Story/Story";

export type AnnouncementCategory =
  | "league"
  | "trial"
  | "news"
  | "match"
  | "medal"
  | "interview";

export interface Announcement {
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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * A thing to DO rather than a thing to READ. These sit in a compact strip at
 * the top of the page and never show their full text — a registration notice
 * is a deadline and a button, and printing all 1,200 words of it pushed every
 * match report below the fold.
 *
 * Shared with the home page so a post cannot be a notice in one place and a
 * story in the other.
 */
const isAction = (a: Announcement) => isRegistrationPost(a);

/**
 * Any post with a slug has a page. The page falls back to the short body when
 * there is no long-form story, so an older notice written entirely in the body
 * field still reads properly on its own page rather than 404ing.
 */
const hasPage = (a: Announcement): boolean => Boolean(a.slug);

const CATEGORY_BADGES: Record<
  AnnouncementCategory,
  { label: string; className: string }
> = {
  league: { label: "League Registration", className: "bg-[#E43125] text-white" },
  trial: { label: "Trials", className: "bg-[#020022] text-white" },
  news: { label: "News", className: "bg-gray-200 text-gray-700" },
  match: { label: "Match Report", className: "bg-[#020022] text-white" },
  medal: { label: "Awards", className: "bg-amber-500 text-white" },
  interview: { label: "Interview", className: "bg-emerald-600 text-white" },
};

/** Fallback photo when an announcement has none of its own. */
const FALLBACK_IMAGE: Record<AnnouncementCategory, string> = {
  league: "/images/billboard/teams.webp",
  trial: "/images/billboard/Banner2.webp",
  news: "/images/billboard/Banner3.webp",
  match: "/images/billboard/Banner3.webp",
  medal: "/images/billboard/Banner2.webp",
  interview: "/images/billboard/Banner3.webp",
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * The first real sentence or two, never the whole post.
 *
 * Notices are written with a heading-per-line layout ("PAYMENT SCHEDULE",
 * "HOW TO PAY"), so the first paragraph alone can be a single shouted word.
 * Skip lines that look like a section heading and take the first line that
 * reads like prose.
 */
const excerpt = (body: string, max = 170): string => {
  const lines = (body ?? "")
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const prose =
    lines.find(
      (l) => l.length > 40 && l !== l.toUpperCase() && !/^[-–—•]/.test(l)
    ) ??
    lines[0] ??
    "";

  const clean = prose.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
};

const CategoryBadge = ({
  category,
  className = "",
}: {
  category: AnnouncementCategory;
  className?: string;
}) => {
  const badge = CATEGORY_BADGES[category] ?? CATEGORY_BADGES.news;
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badge.className} ${className}`}
    >
      {badge.label}
    </span>
  );
};

/** Where a card should send someone: its own page, or its button's target. */
const destination = (a: Announcement): string =>
  hasPage(a) ? `/announcements/${a.slug}` : a.ctaUrl || "/announcements";

const isExternal = (href: string) => !href.startsWith("/");

/**
 * A registration notice, compressed to one row.
 *
 * Title, one line, the button — and "Full details" opens the rest **in place**
 * rather than navigating anywhere.
 *
 * It used to link to the post's own page, which quietly did nothing for the
 * three notices that matter most: Winter League, Trials and Indoor all predate
 * the slug column, so they have no page, the link never rendered, and the only
 * clickable thing left was the button. A parent who wanted to read the payment
 * schedule got an e-Transfer form or a mail client instead.
 *
 * Expanding in place needs no slug, no migration and no navigation. It is also
 * simply better for a notice: the details are the payment schedule and the
 * dates, and you want them next to the button, not one page away from it.
 */
const ActionRow = ({ announcement }: { announcement: Announcement }) => {
  const [open, setOpen] = useState(false);
  const label = announcement.ctaLabel || "Read more";
  const buttonClass =
    "shrink-0 rounded-lg bg-[#E43125] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c4291f]";
  const detailsId = `notice-${announcement.id}`;

  // The long text lives in fullBody when there is one and body otherwise —
  // these older notices were written entirely into body.
  const details = (announcement.fullBody ?? "").trim() || announcement.body;
  const hasMore = details.trim().length > 140;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <CategoryBadge category={announcement.category} />
            <time
              dateTime={announcement.eventDate || announcement.createdAt}
              className="text-xs text-gray-500"
            >
              {formatDate(announcement.eventDate || announcement.createdAt)}
            </time>
          </div>
          <h3 className="text-base font-bold leading-snug text-[#020022] sm:text-lg">
            {announcement.title}
          </h3>
          {!open && (
            <p className="mt-1 text-sm text-gray-600">
              {excerpt(announcement.body, 130)}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {announcement.ctaUrl ? (
            isExternal(announcement.ctaUrl) ? (
              <a
                href={announcement.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass}
              >
                {label}
              </a>
            ) : (
              <Link href={announcement.ctaUrl} className={buttonClass}>
                {label}
              </Link>
            )
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={buttonClass}
            >
              Read more
            </button>
          )}
          {hasMore && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={detailsId}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-[#E43125] hover:underline"
            >
              {open ? "Hide details" : "Full details"}
              <ChevronDown
                size={13}
                aria-hidden
                className={`transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div
          id={detailsId}
          className="mt-5 border-t border-gray-100 pt-5 text-[15px]"
        >
          <Story text={details} />
          {hasPage(announcement) && (
            <Link
              href={`/announcements/${announcement.slug}`}
              className="mt-2 inline-block text-sm font-medium text-[#E43125] hover:underline"
            >
              Open as its own page →
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * A news card. The whole card is one link — a parent should not have to find
 * a small "read more" at the bottom of a block of text.
 */
const NewsCard = ({
  announcement,
  index,
}: {
  announcement: Announcement;
  index: number;
}) => {
  const href = destination(announcement);
  const photoCount = (announcement.photos ?? []).filter((p) => p?.url).length;

  const inner = (
    <>
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={
            announcement.imageUrl ||
            FALLBACK_IMAGE[announcement.category] ||
            FALLBACK_IMAGE.news
          }
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
          unoptimized={Boolean(announcement.imageUrl)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <CategoryBadge
          category={announcement.category}
          className="absolute left-4 top-4"
        />
        {photoCount > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            {photoCount} photos
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <time
          dateTime={announcement.eventDate || announcement.createdAt}
          className="text-xs text-gray-500"
        >
          {formatDate(announcement.eventDate || announcement.createdAt)}
        </time>
        <h3 className="mt-1.5 text-lg font-bold leading-snug text-[#020022]">
          {announcement.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
          {excerpt(announcement.body)}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#E43125] group-hover:underline">
          Read the full story
          <ArrowRight size={15} aria-hidden />
        </span>
      </div>
    </>
  );

  const shell =
    "group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:shadow-lg";

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ delay: Math.min(index, 5) * 0.07, duration: 0.45 }}
      className="h-full"
    >
      {isExternal(href) ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={shell}
        >
          {inner}
        </a>
      ) : (
        <Link href={href} className={shell}>
          {inner}
        </Link>
      )}
    </motion.article>
  );
};

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await fetch(`${API_URL}/announcements`);
        if (!response.ok) throw new Error("Failed to fetch announcements");
        const data: Announcement[] = await response.json();
        if (!cancelled) setAnnouncements(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        if (!cancelled) {
          setLoadError(
            "We couldn't load the latest announcements. Please try again."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const newest = (a: Announcement, b: Announcement) =>
    new Date(b.eventDate || b.createdAt).getTime() -
    new Date(a.eventDate || a.createdAt).getTime();

  /**
   * League registration leads, then trials, then anything else.
   *
   * Sorting these by date put the Indoor notice above Winter League simply
   * because it was posted later — while Winter League is the one with money
   * due in a few days. The urgent thing goes first, not the recent one.
   */
  const ACTION_ORDER: Partial<Record<AnnouncementCategory, number>> = {
    league: 0,
    trial: 1,
  };

  const actions = announcements
    .filter(isAction)
    .sort(
      (a, b) =>
        (ACTION_ORDER[a.category] ?? 2) - (ACTION_ORDER[b.category] ?? 2) ||
        newest(a, b)
    );
  const news = announcements.filter((a) => !isAction(a)).sort(newest);

  return (
    <section className="bg-gray-50">
      {/* ---------------------------------------------------------- hero */}
      <motion.div
        className="bg-[#020022] text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center text-sm text-gray-400">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-[#E43125]">News &amp; Trials</span>
          </div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#E43125]">
            Excel Pro Soccer Academy
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            News &amp; Registration
          </h1>
          <p className="mt-3 max-w-2xl text-gray-300">
            Match reports, awards and academy news — and everything currently
            open for registration.
          </p>
        </div>
      </motion.div>

      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="mt-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#E43125]" />
            <span className="ml-3 text-gray-600">Loading…</span>
          </div>
        ) : loadError ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-16 text-center shadow-sm">
            <XCircle className="mb-3 h-10 w-10 text-[#E43125]" />
            <p className="mb-4 text-gray-700">{loadError}</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-2 rounded-md bg-[#E43125] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#c4291f]"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="mt-10 rounded-xl border border-gray-200 bg-white px-4 py-16 text-center text-gray-600 shadow-sm">
            No announcements right now — check back soon.
          </div>
        ) : (
          <>
            {/* ------------------------------------------- open right now */}
            {actions.length > 0 && (
              <div className="-mt-8">
                <div className="space-y-3">
                  {actions.map((a) => (
                    <ActionRow key={a.id} announcement={a} />
                  ))}
                </div>
              </div>
            )}

            {/* -------------------------------------------------- the news */}
            {news.length > 0 && (
              <div className={actions.length > 0 ? "mt-14" : "mt-10"}>
                <div className="mb-6 flex items-end justify-between gap-3">
                  <h2 className="text-2xl font-bold text-[#020022]">
                    Latest news
                  </h2>
                  <p className="text-sm text-gray-500">
                    {news.length} {news.length === 1 ? "story" : "stories"}
                  </p>
                </div>
                <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {news.map((a, i) => (
                    <NewsCard key={a.id} announcement={a} index={i} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Announcements;
