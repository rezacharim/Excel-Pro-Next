"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface NewsCard {
  id: number;
  href: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  /** True when the photo came from the dashboard rather than /public. */
  remoteImage: boolean;
  badgeLabel: string;
  badgeClass: string;
  ctaLabel: string | null;
}

const ROTATE_MS = 6000;

/**
 * The home page news slider.
 *
 * Three stories at a time on a wide screen, two on a tablet, one on a phone,
 * sliding one card at a time. Auto-rotation stops on hover, on focus, and for
 * anyone who has asked their system for reduced motion — a carousel that keeps
 * moving while you are trying to read it is worse than no carousel.
 */
const NewsSlider = ({ items }: { items: NewsCard[] }) => {
  const [perView, setPerView] = useState(3);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const medium = window.matchMedia("(min-width: 640px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setPerView(wide.matches ? 3 : medium.matches ? 2 : 1);
    reducedMotion.current = motion.matches;
    apply();
    wide.addEventListener("change", apply);
    medium.addEventListener("change", apply);
    return () => {
      wide.removeEventListener("change", apply);
      medium.removeEventListener("change", apply);
    };
  }, []);

  const maxIndex = Math.max(0, items.length - perView);

  // A narrower window can leave the track scrolled past the end.
  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const go = useCallback(
    (delta: number) =>
      setIndex((i) => (i + delta < 0 ? maxIndex : (i + delta) % (maxIndex + 1))),
    [maxIndex]
  );

  useEffect(() => {
    if (paused || reducedMotion.current || maxIndex === 0) return;
    const timer = setInterval(() => go(1), ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, maxIndex, go]);

  if (items.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* The gutter lives on every card so the spacing between them is even.
          Pulling the viewport out by the same amount keeps the first and last
          cards flush with the rest of the page instead of inset by a gutter. */}
      <div className="overflow-hidden sm:-mx-3">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="w-full flex-shrink-0 px-0 sm:w-1/2 sm:px-3 lg:w-1/3"
            >
              <Link
                href={item.href}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:shadow-lg"
              >
                <div className="relative h-44 w-full overflow-hidden sm:h-52">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    unoptimized={item.remoteImage}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <span
                    className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${item.badgeClass}`}
                  >
                    {item.badgeLabel}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs text-gray-500">{item.date}</p>
                  <h3 className="mt-2 text-lg font-bold leading-snug text-[#020022]">
                    {item.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">
                    {item.excerpt}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#E43125] group-hover:underline">
                    {item.ctaLabel || "Read more"}
                    <span aria-hidden>&rarr;</span>
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {maxIndex > 0 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous story"
            className="absolute -left-2 top-24 z-10 rounded-full bg-white/95 p-2 text-[#020022] shadow-md ring-1 ring-gray-200 hover:bg-white sm:-left-4"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next story"
            className="absolute -right-2 top-24 z-10 rounded-full bg-white/95 p-2 text-[#020022] shadow-md ring-1 ring-gray-200 hover:bg-white sm:-right-4"
          >
            <ChevronRight size={20} />
          </button>

          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to story ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-[#E43125]" : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default NewsSlider;
