"use client";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import HeroSideCard from "../../molecules/HeroSideCard/HeroSideCard";
import IndicatorDots from "../../molecules/IndicatorDots/IndicatorDots";
import ArrowButton from "../../atoms/ArrowButton/ArrowButton";
import { usePlayers } from "@/context/PlayerContext/PlayerContext";
import Link from "next/link";
import { fetchAllImages } from "@/services/getAllImages";

interface HeroSlide {
  id: string;
  image_url: string;
  title?: string;
  /** Set on the two slides pulled from announcements; photos have none. */
  href?: string;
  badge?: string;
  headline?: string;
  subtext?: string;
  ctaLabel?: string;
  /** Short live facts — deadline, spots left. League slide only. */
  urgency?: string[];
}

interface PromoPost {
  id: number;
  title: string;
  slug?: string | null;
  body: string;
  category: string;
  fullBody?: string | null;
  photos?: { url: string }[] | null;
  eventDate?: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

const REGISTRATION_CATEGORIES = ["league", "trial"];
const STORY_CATEGORIES = ["news", "match", "medal", "interview"];

const PROMO_FALLBACK_IMAGE: Record<string, string> = {
  league: "/images/billboard/teams.webp",
  trial: "/images/billboard/Banner2.webp",
  medal: "/images/billboard/Banner2.webp",
};

const PROMO_BADGE: Record<string, string> = {
  league: "League Registration",
  trial: "Open Trials",
  news: "Academy News",
  match: "Match Report",
  medal: "Awards",
  interview: "Interview",
};

/** Where a slide should send someone who clicks it. */
const promoHref = (post: PromoPost): string => {
  const hasPage =
    post.slug &&
    ((post.fullBody ?? "").trim().length > 0 ||
      (post.photos ?? []).some((p) => p?.url));
  if (hasPage) return `/announcements/${post.slug}`;
  return post.ctaUrl || "/announcements";
};

interface SeasonAgeGroup {
  ageGroup: string;
  spotsLeft: number;
  label: string;
  tone: "ok" | "medium" | "low" | "full";
  show: boolean;
}

interface PublicSeason {
  registrationOpen: boolean;
  firstPaymentDue: string | null;
  lateFeeFrom: string | null;
  isLateNow: boolean;
  recentSignups: number;
  spotsDisplay: string;
  ageGroups: SeasonAgeGroup[];
}

/** Whole days from today to a yyyy-mm-dd date, ignoring time of day. */
const daysUntil = (date: string): number => {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

/**
 * Live facts for the league slide: how long is left to pay, and which age
 * group is closest to full.
 *
 * Every number here comes from `GET /league/season` — the same figures the
 * registration page shows. Nothing is invented and nothing is padded: if the
 * season is set to hide spot counts, or no group is actually running low, the
 * pill simply doesn't appear. A fake "only 2 left!" on a page a parent will
 * check again next week costs more trust than it buys signups.
 */
const leagueUrgency = async (): Promise<string[]> => {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) return [];
  try {
    const response = await fetch(`${api}/league/season`);
    if (!response.ok) return [];
    const season: PublicSeason = await response.json();
    if (!season?.registrationOpen) return [];

    const facts: string[] = [];

    const due = season.lateFeeFrom || season.firstPaymentDue;
    if (due) {
      const days = daysUntil(due);
      if (season.isLateNow || days < 0) {
        facts.push("Late fee now applies");
      } else if (days === 0) {
        facts.push("First payment due today");
      } else if (days <= 21) {
        facts.push(`First payment due in ${days} day${days === 1 ? "" : "s"}`);
      }
    }

    // The tightest group is the honest one to name. "Spots available" and
    // "Filling fast" are not urgent enough to earn hero space.
    const tight = (season.ageGroups ?? [])
      .filter((g) => g.show && (g.tone === "low" || g.tone === "full"))
      .sort((a, b) => a.spotsLeft - b.spotsLeft)[0];
    if (tight) facts.push(`${tight.ageGroup}: ${tight.label.toLowerCase()}`);

    // Only when there is nothing sharper to say. A number that grows is better
    // social proof than a big "spots left", which reads as "no rush".
    if (facts.length < 2 && season.recentSignups >= 3) {
      facts.push(`${season.recentSignups} families joined this week`);
    }

    return facts.slice(0, 2);
  } catch {
    return [];
  }
};

const firstLine = (body: string, max = 110): string => {
  const line = (body ?? "").split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max).trimEnd()}…` : line;
};

/**
 * Turns the newest registration notice and the newest story into hero slides.
 *
 * The front page's most valuable space was showing photographs and nothing
 * else — a parent landing there could not tell that registration was open or
 * that the U13s had won anything. These two slides keep themselves current:
 * post a match report and it appears on the home page without anyone
 * remembering to change a banner.
 */
const buildPromoSlides = async (): Promise<HeroSlide[]> => {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) return [];
  try {
    const response = await fetch(`${api}/announcements`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const live: PromoPost[] = data
      .filter((p: PromoPost) => p?.isActive)
      .sort(
        (a: PromoPost, b: PromoPost) =>
          new Date(b.eventDate || b.createdAt).getTime() -
          new Date(a.eventDate || a.createdAt).getTime()
      );

    const pick = (categories: string[]) =>
      live.find((p) => categories.includes(p.category));

    // League and trials each get their own slide rather than competing for one,
    // so the hero cycles registration -> trials -> latest story instead of
    // always showing whichever of the two happened to be posted last.
    const chosen = [
      pick(["league"]),
      pick(["trial"]),
      pick(STORY_CATEGORIES),
    ].filter(Boolean) as PromoPost[];

    // Only the league slide gets live figures — trials and stories have no
    // season behind them, so there is nothing truthful to count.
    const urgency = chosen.some((p) => p.category === "league")
      ? await leagueUrgency()
      : [];

    return chosen.map((post) => ({
      id: `promo-${post.id}`,
      image_url:
        post.imageUrl ||
        PROMO_FALLBACK_IMAGE[post.category] ||
        "/images/billboard/Banner3.webp",
      title: post.title,
      href: promoHref(post),
      badge: PROMO_BADGE[post.category] ?? "Academy News",
      headline: post.title,
      subtext: firstLine(post.body),
      ctaLabel: REGISTRATION_CATEGORIES.includes(post.category)
        ? post.ctaLabel || "Register now"
        : "Read the full story",
      urgency: post.category === "league" ? urgency : undefined,
    }));
  } catch {
    // The hero must never fail because the news feed is unavailable.
    return [];
  }
};

const FALLBACK: HeroSlide[] = [
  { id: "fallback", image_url: "/images/billboard/teams2.jpeg", title: "" },
];

const ROTATE_MS = 5000;
const MAX_PHOTO_SLIDES = 10;
const MAX_PROMO_SLIDES = 3;

/**
 * Home-page hero slideshow.
 *
 * Slides come from the academy's Gallery (Dashboard -> Gallery), newest
 * first, so the front page always shows fresh action photos. Falls back to
 * player-of-the-month images, then to a static team photo, when the gallery
 * is empty. Auto-rotates with manual arrows + dots.
 */

/**
 * Every image URL currently used by a coach — their card photo and every
 * picture in their profile gallery. Returns an empty set if the API is
 * unreachable, so a hiccup shows a slightly wrong slideshow rather than none.
 */
const coachPhotoUrls = async (): Promise<Set<string>> => {
  const used = new Set<string>();
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) return used;
  try {
    const response = await fetch(`${api}/coaches`);
    if (!response.ok) return used;
    const coaches = await response.json();
    if (!Array.isArray(coaches)) return used;
    for (const coach of coaches) {
      if (coach?.imageUrl) used.add(coach.imageUrl);
      if (Array.isArray(coach?.photos)) {
        for (const photo of coach.photos) {
          if (photo?.url) used.add(photo.url);
        }
      }
    }
  } catch {
    // Leave the set empty; the slideshow still works.
  }
  return used;
};

const Billboard = () => {
  const players = usePlayers();
  const [slides, setSlides] = useState<HeroSlide[]>(FALLBACK);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchAllImages();
      if (cancelled) return;

      // Photos attached to a coach's profile are deliberately kept off the
      // front page. Uploading a coach's career photos puts them in the same
      // Gallery this slideshow reads from, so without this the eight newest
      // uploads — someone's old team pictures — would silently replace the
      // academy's action shots on the home page.
      const coachOwned = await coachPhotoUrls();
      if (cancelled) return;

      const usable = (Array.isArray(data) ? data : [])
        .filter((g: { image_url?: string }) => g?.image_url)
        .filter(
          (g: { image_url?: string }) => !coachOwned.has(g.image_url as string)
        );

      // Photos ticked "Show on home page" in Dashboard > Gallery win. If none
      // are ticked we fall back to the newest uploads, so the front page is
      // never empty just because nobody has chosen yet.
      const chosen = usable.filter(
        (g: { show_on_home?: boolean }) => g?.show_on_home
      );
      const pool = chosen.length > 0 ? chosen : usable;

      const gallery: HeroSlide[] = pool
        .sort(
          (a: { created_at?: string }, b: { created_at?: string }) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
        )
        .slice(0, MAX_PHOTO_SLIDES)
        .map(
          (g: { id?: string; image_url: string; title?: string }, i: number) => ({
            id: g.id ?? `g-${i}`,
            image_url: g.image_url,
            title: g.title,
          })
        );
      const promos = (await buildPromoSlides()).slice(0, MAX_PROMO_SLIDES);
      if (cancelled) return;

      // Registration and the newest story lead, then the photos. The two
      // promos carry a deadline or a result; a photograph carries neither.
      const combined = [...promos, ...gallery];

      if (combined.length > 0) {
        setSlides(combined);
      } else if (players.length > 0) {
        setSlides(
          players.map((p, i) => ({
            id: `p-${i}`,
            image_url: p.image_url,
            title: p.player_name,
          }))
        );
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = useCallback(
    () => setCurrent((prev) => (prev + 1) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (slides.length < 2) return;
    const interval = setInterval(next, ROTATE_MS);
    return () => clearInterval(interval);
  }, [slides.length, next]);

  useEffect(() => {
    // keep index valid when the slide set changes
    setCurrent(0);
  }, [slides.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 11 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="flex flex-col md:flex-row md:space-x-6 w-full h-[500px] relative">
        <div className="relative w-min-full md:w-3/4 h-full min-h-[250px] sm:min-h-[250px] md:min-h-[500px] bg-gray-900 rounded-lg shadow-xl overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              // Every slide is stacked at inset-0 and only faded out, so a
              // hidden slide still sits on top of the visible one and would
              // swallow every click aimed at its link. Invisible slides take
              // no pointer events.
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === current
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
              aria-hidden={index !== current}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.image_url}
                alt={
                  slide.title ||
                  "Excel Pro Soccer Academy players in action in Markham"
                }
                className="h-full w-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
              {/* Only the two slides built from announcements carry text. A
                  gallery photo's title is a filename, which looked like a
                  mistake when drawn over the front page. */}
              {slide.href && (
                <Link
                  href={slide.href}
                  className="absolute inset-0 flex flex-col justify-end"
                  tabIndex={index === current ? 0 : -1}
                >
                  <div className="bg-gradient-to-t from-black/85 via-black/45 to-transparent p-6 sm:p-10">
                    <div className="flex flex-wrap items-center gap-2">
                      {slide.badge && (
                        <span className="inline-block rounded-full bg-[#E43125] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                          {slide.badge}
                        </span>
                      )}
                      {slide.urgency?.map((fact) => (
                        <span
                          key={fact}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm"
                        >
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 rounded-full bg-amber-400"
                          />
                          {fact}
                        </span>
                      ))}
                    </div>
                    <h2 className="mt-3 max-w-3xl text-2xl font-bold leading-tight text-white sm:text-4xl">
                      {slide.headline}
                    </h2>
                    {slide.subtext && (
                      <p className="mt-2 hidden max-w-2xl text-sm text-white/85 sm:block sm:text-base">
                        {slide.subtext}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#020022] transition hover:bg-gray-100">
                      {slide.ctaLabel}
                      <span aria-hidden>&rarr;</span>
                    </span>
                  </div>
                </Link>
              )}
              {/* No caption is drawn over hero photos. Gallery titles are
                  filenames like "excel-pro image 1", which looked like a
                  mistake on the front page. The title still serves as the
                  image's alt text for search engines and screen readers. */}
            </div>
          ))}

          {slides.length > 1 && (
            // pointer-events-none on the strip, auto on the two buttons. This
            // bar spans the full width of the hero, so without it the middle
            // of every slide was a dead zone that swallowed clicks meant for
            // the promo link underneath.
            <div className="pointer-events-none absolute top-1/2 left-0 right-0 z-20 flex justify-between px-4 transform -translate-y-1/2">
              <span className="pointer-events-auto">
                <ArrowButton
                  direction="left"
                  onClick={() =>
                    setCurrent(
                      (prev) => (prev - 1 + slides.length) % slides.length
                    )
                  }
                />
              </span>
              <span className="pointer-events-auto">
                <ArrowButton direction="right" onClick={next} />
              </span>
            </div>
          )}
        </div>
        {/* Two equal cards beside the hero. They share HeroSideCard so their
            heights and captions always match — previously the coach card's
            white caption panel had its own height and collided with the
            Player of the Month card below it. */}
        <div className="md:w-1/4 h-full flex flex-col gap-4 my-6 lg:my-0 md:my-0 sm:my-6">
          <HeroSideCard
            imageUrl="/images/person/reza-abedian.webp"
            title="Reza Abedian"
            subtitle="Owner & Head Coach"
            alt="Reza Abedian, owner and head coach of Excel Pro Soccer Academy"
            focus="center 20%"
            href="/coaches"
            priority
          />
          {players.length > 0 && (
            <HeroSideCard
              imageUrl={players[0].image_url}
              title={players[0].player_name}
              badge="Player of the Month"
              // The caption typed in Dashboard > Player of the Month is the
              // reason they won it. Showing the name alone left parents with
              // no idea what the player had actually done.
              note={players[0].caption?.trim() || undefined}
              alt={`${players[0].player_name} — Excel Pro player of the month`}
              href="/matchday"
            />
          )}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="flex justify-center">
          <IndicatorDots
            slideCount={slides.length}
            currentSlide={current}
            goToSlide={setCurrent}
          />
        </div>
      )}
    </motion.div>
  );
};

export default Billboard;
