"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getTestimonials,
  initials,
  type Testimonial as TestimonialItem,
} from "@/services/testimonials";
import {
  fetchSiteText,
  SITE_TEXT_DEFAULTS,
  type SiteText,
} from "@/services/siteText";

const ROTATE_MS = 8000;

/**
 * What parents and players say about Excel Pro.
 *
 * Fed by Dashboard -> Testimonials. If the list is empty the whole section
 * disappears rather than falling back to anything — this replaced four
 * invented quotes that shipped with the site template, and a blank space is
 * far better than a fake endorsement.
 *
 * Auto-advances slowly and stops on hover, on focus, and for anyone who has
 * asked their system for reduced motion. A quote you are halfway through
 * reading should not slide away.
 */
const Testimonial = () => {
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [text, setText] = useState<SiteText>(SITE_TEXT_DEFAULTS);
  const reducedMotion = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getTestimonials().then((list) => {
      if (!cancelled) setItems(list);
    });
    fetchSiteText().then((copy) => {
      if (!cancelled) setText(copy);
    });
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    return () => {
      cancelled = true;
    };
  }, []);

  const go = useCallback(
    (delta: number) =>
      setIndex((i) => (items.length ? (i + delta + items.length) % items.length : 0)),
    [items.length]
  );

  useEffect(() => {
    if (paused || reducedMotion.current || items.length < 2) return;
    const timer = setInterval(() => go(1), ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, items.length, go]);

  if (items.length === 0) return null;

  const current = items[Math.min(index, items.length - 1)];

  return (
    // Reveals on mount rather than on scroll. useInView was measured before
    // the fetch resolved, so its ref was still null when the observer was set
    // up — the section rendered its text and then sat at opacity 0 forever.
    // The data arriving is the reveal.
    <motion.section
      className="w-full bg-white px-4 py-12 md:px-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-7xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#E43125]">
          {text["testimonials.eyebrow"]}
        </p>
        <h2 className="mb-8 text-3xl font-bold text-[#121212] md:text-4xl">
          {text["testimonials.heading"]}
        </h2>

        <div
          className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-gray-100"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div className="flex flex-col md:flex-row">
            {/* Photo. Optional on purpose — a real quote with no picture is
                worth more than a real quote with a stock one. */}
            <div className="relative h-56 w-full flex-shrink-0 bg-[#020022] md:h-auto md:w-2/5">
              <AnimatePresence mode="wait">
                {current.imageUrl ? (
                  <motion.img
                    key={current.id}
                    src={current.imageUrl}
                    alt={`${current.name}, Excel Pro Soccer Academy`}
                    className="absolute inset-0 h-full w-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                ) : (
                  <motion.div
                    key={`initials-${current.id}`}
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#E43125] text-3xl font-bold text-white">
                      {initials(current.name)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quote */}
            <div className="relative flex w-full flex-col justify-between p-6 sm:p-10 md:w-3/5">
              <svg
                aria-hidden
                viewBox="0 0 219 172"
                className="pointer-events-none absolute right-6 top-6 h-14 w-16 opacity-15 sm:h-20 sm:w-24"
                fill="none"
              >
                <path
                  d="M14.6468 81.3625V81.3654C14.6468 86.6835 18.8957 90.9324 24.2138 90.9324H80.4335V166.25H5.11594V81.3654C5.11594 42.4979 34.326 10.3116 71.8874 5.59208V15.1819C56.8496 17.3803 42.9536 24.6443 32.5443 35.8468C21.0497 48.2174 14.6566 64.4759 14.6468 81.3625ZM213.876 90.9324V166.25H138.559V81.3654C138.559 42.4969 167.772 10.3052 205.419 5.59062V15.1726C173.004 19.8435 148.09 47.7017 148.09 81.3654C148.09 86.6835 152.339 90.9324 157.657 90.9324H213.876Z"
                  stroke="#FC0D1C"
                  strokeWidth="10.2319"
                />
              </svg>

              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={current.id}
                  className="relative z-10"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  {/* Right padding keeps the first line clear of the quote
                      mark in the corner. */}
                  <p className="whitespace-pre-line pr-16 text-lg leading-relaxed text-gray-700 sm:pr-24 sm:text-xl">
                    {current.quote}
                  </p>
                  <footer className="mt-6">
                    <p className="text-base font-bold text-[#121212]">
                      {current.name}
                    </p>
                    {current.role && (
                      <p className="text-sm text-gray-500">{current.role}</p>
                    )}
                  </footer>
                </motion.blockquote>
              </AnimatePresence>

              {items.length > 1 && (
                <div className="relative z-10 mt-8 flex items-center justify-between">
                  <div className="flex gap-2">
                    {items.map((item, i) => (
                      <button
                        key={item.id}
                        onClick={() => setIndex(i)}
                        aria-label={`Show what ${item.name} said`}
                        aria-current={i === index}
                        className={`h-2 rounded-full transition-all ${
                          i === index ? "w-6 bg-[#E43125]" : "w-2 bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => go(-1)}
                      aria-label="Previous testimonial"
                      className="rounded-full border border-gray-200 p-2 text-[#020022] transition hover:bg-gray-50"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => go(1)}
                      aria-label="Next testimonial"
                      className="rounded-full border border-gray-200 p-2 text-[#020022] transition hover:bg-gray-50"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default Testimonial;
