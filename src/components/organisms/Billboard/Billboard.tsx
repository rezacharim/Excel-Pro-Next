"use client";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import RezaCard from "../../molecules/RezaCard/RezaCard";
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
const Billboard = () => {
  const players = usePlayers();
  const [slides, setSlides] = useState<HeroSlide[]>(FALLBACK);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchAllImages();
      if (cancelled) return;
      const gallery: HeroSlide[] = (Array.isArray(data) ? data : [])
        .filter((g: { image_url?: string }) => g?.image_url)
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
              {slide.title ? (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 pb-4 pt-12">
                  <p className="text-white text-sm md:text-base font-medium">
                    {slide.title}
                  </p>
                </div>
              ) : null}
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
        <div className="md:w-1/4 h-full flex flex-col gap-4 my-6 lg:my-0 md:my-0 sm:my-6">
          {/* Coach card and Player of the Month share the column evenly. The
              player photo gets a portrait shape because action shots are taken
              upright — a short letterbox strip cut heads off. */}
          <RezaCard />
          {players.length > 0 && (
            <a
              href="/matchday"
              className="relative rounded-lg shadow-xl overflow-hidden flex-1 min-h-[240px] group block bg-gray-900"
              aria-label={`Player of the month: ${players[0].player_name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={players[0].image_url}
                alt={`${players[0].player_name} — Excel Pro player of the month`}
                // Faces sit in the upper third of a standing photo, so anchor
                // the crop there instead of the centre.
                className="h-full w-full object-cover object-[center_25%] transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-2 left-2 bg-primary text-white text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow">
                Player of the Month
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-10">
                <p className="text-white text-sm font-semibold truncate">
                  {players[0].player_name}
                </p>
              </div>
            </a>
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
