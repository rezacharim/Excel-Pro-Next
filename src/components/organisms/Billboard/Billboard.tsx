"use client";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import HeroSideCard from "../../molecules/HeroSideCard/HeroSideCard";
import IndicatorDots from "../../molecules/IndicatorDots/IndicatorDots";
import ArrowButton from "../../atoms/ArrowButton/ArrowButton";
import { usePlayers } from "@/context/PlayerContext/PlayerContext";
import { fetchAllImages } from "@/services/getAllImages";

interface HeroSlide {
  id: string;
  image_url: string;
  title?: string;
}

const FALLBACK: HeroSlide[] = [
  { id: "fallback", image_url: "/images/billboard/teams2.jpeg", title: "" },
];

const ROTATE_MS = 5000;
const MAX_SLIDES = 8;

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
        .slice(0, MAX_SLIDES)
        .map(
          (g: { id?: string; image_url: string; title?: string }, i: number) => ({
            id: g.id ?? `g-${i}`,
            image_url: g.image_url,
            title: g.title,
          })
        );
      if (gallery.length > 0) {
        setSlides(gallery);
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
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === current ? "opacity-100" : "opacity-0"
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
              {/* No caption is drawn over hero photos. Gallery titles are
                  filenames like "excel-pro image 1", which looked like a
                  mistake on the front page. The title still serves as the
                  image's alt text for search engines and screen readers. */}
            </div>
          ))}

          {slides.length > 1 && (
            <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 transform -translate-y-1/2">
              <ArrowButton
                direction="left"
                onClick={() =>
                  setCurrent(
                    (prev) => (prev - 1 + slides.length) % slides.length
                  )
                }
              />
              <ArrowButton direction="right" onClick={next} />
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
