"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { RefreshCw, XCircle } from "lucide-react";

export type AnnouncementCategory = "league" | "trial" | "news";

export interface Announcement {
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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const CATEGORY_BADGES: Record<
  AnnouncementCategory,
  { label: string; className: string }
> = {
  league: {
    label: "League Registration",
    className: "bg-[#E43125] text-white",
  },
  trial: {
    label: "Trials",
    className: "bg-[#020022] text-white",
  },
  news: {
    label: "News",
    className: "bg-gray-200 text-gray-700",
  },
};

/**
 * League registration and trials carry deadlines; general news does not.
 * The ones a parent has to act on go first regardless of when they were
 * posted, then newest within each group.
 */
const PRIORITY: Record<AnnouncementCategory, number> = {
  league: 0,
  trial: 1,
  news: 2,
};

const byImportance = (a: Announcement, b: Announcement) =>
  (PRIORITY[a.category] ?? 9) - (PRIORITY[b.category] ?? 9) ||
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/** Fallback photo when an announcement has none of its own. */
const FALLBACK_IMAGE: Record<AnnouncementCategory, string> = {
  league: "/images/billboard/teams.webp",
  trial: "/images/billboard/Banner2.webp",
  news: "/images/billboard/Banner3.webp",
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

const CategoryBadge = ({ category }: { category: AnnouncementCategory }) => {
  const badge = CATEGORY_BADGES[category] ?? CATEGORY_BADGES.news;
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}
    >
      {badge.label}
    </span>
  );
};

const AnnouncementCta = ({
  announcement,
}: {
  announcement: Announcement;
}) => {
  if (!announcement.ctaUrl) return null;
  const label = announcement.ctaLabel || "Learn more";
  const className =
    "inline-block mt-4 px-6 py-2.5 bg-primary hover:bg-[#c9281e] text-white rounded-md text-sm font-medium transition-colors";

  if (announcement.ctaUrl.startsWith("/")) {
    return (
      <Link href={announcement.ctaUrl} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <a
      href={announcement.ctaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label}
    </a>
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
        if (!response.ok) {
          throw new Error("Failed to fetch announcements");
        }
        const data: Announcement[] = await response.json();
        if (!cancelled) {
          const sorted = [...data].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAnnouncements(sorted);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
        if (!cancelled) {
          setLoadError(
            "We couldn't load the latest announcements. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <section className="bg-white overflow-hidden">
      {/* Hero */}
      <motion.div
        className="bg-[#FFF3F2] bg-[url('/images/other/tech-bg.png')] bg-cover bg-center px-4 sm:px-6 lg:px-8 pt-8 pb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex items-center text-sm text-gray-500 my-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-red-500 font-medium">News & Trials</span>
          </motion.div>

          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <motion.span
              className="inline-block px-3 py-1 bg-red-100 text-red-500 text-sm font-medium rounded-xl mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Announcements
            </motion.span>
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              News, Trials &amp; League Registration
            </motion.h1>
            <motion.p
              className="mt-4 text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              The latest academy news, upcoming trials and league registration
              windows — all in one place.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Announcement cards */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600">Loading announcements...</span>
          </div>
        ) : loadError ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 flex flex-col items-center justify-center py-16 px-4 text-center">
            <XCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-gray-700 mb-4">{loadError}</p>
            <button
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-[#c9281e] text-white rounded-md text-sm font-medium transition-colors"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 py-16 px-4 text-center text-gray-600">
            No announcements right now — check back soon.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 items-start">
            {[...announcements].sort(byImportance).map((announcement, index) => (
              <motion.article
                key={announcement.id}
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: Math.min(index, 4) * 0.1, duration: 0.5 }}
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={
                      announcement.imageUrl ||
                      FALLBACK_IMAGE[announcement.category] ||
                      FALLBACK_IMAGE.news
                    }
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    unoptimized={Boolean(announcement.imageUrl)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <CategoryBadge category={announcement.category} />
                    <time
                      dateTime={announcement.createdAt}
                      className="text-sm text-gray-500"
                    >
                      {formatDate(announcement.createdAt)}
                    </time>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    {announcement.title}
                  </h2>
                  <p className="mt-3 text-gray-600 leading-relaxed whitespace-pre-line flex-1">
                    {announcement.body}
                  </p>
                  <AnnouncementCta announcement={announcement} />
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Announcements;
