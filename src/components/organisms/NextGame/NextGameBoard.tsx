"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, CalendarPlus, MapPin } from "lucide-react";
import {
  fixtureCountdown,
  fixtureDay,
  fixtureDayNumber,
  fixtureMonthShort,
  fixtureTime,
  calendarSubscribeUrl,
  downloadIcs,
  nextPerTeam,
  teamName,
  teamPhoto,
  type Fixture,
  type Team,
} from "@/services/fixtures";

const ROTATE_MS = 6000;
const LIST_LENGTH = 6;

/**
 * The home page fixtures block.
 *
 * A card that rotates through each team's next game, and beneath it the next
 * few games across the whole academy. The two are linked: whichever team the
 * card is showing, that team's rows in the list light up and the rest fade
 * back — so the rotation is doing something useful rather than just moving.
 *
 * Clicking a row jumps the card to that team, which is how a parent who only
 * cares about one age group gets to it without waiting for the carousel.
 */
const NextGameBoard = ({
  fixtures,
  teams,
}: {
  fixtures: Fixture[];
  teams: Team[];
}) => {
  const slides = nextPerTeam(fixtures);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  const go = useCallback(
    (delta: number) =>
      setIndex((i) =>
        slides.length ? (i + delta + slides.length) % slides.length : 0
      ),
    [slides.length]
  );

  useEffect(() => {
    if (paused || reducedMotion.current || slides.length < 2) return;
    const timer = setInterval(() => go(1), ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, slides.length, go]);

  if (slides.length === 0) return null;

  const current = slides[Math.min(index, slides.length - 1)];
  const activeKey = current.teamId ?? current.ageGroup;
  const list = fixtures.slice(0, LIST_LENGTH);
  const photo = teamPhoto(current.ageGroup, teams, current.teamId);
  const countdown = fixtureCountdown(current.kickoff);

  const jumpTo = (fixture: Fixture) => {
    const key = fixture.teamId ?? fixture.ageGroup;
    const i = slides.findIndex((s) => (s.teamId ?? s.ageGroup) === key);
    if (i >= 0) setIndex(i);
  };

  return (
    <section className="mx-4 my-16 sm:my-20">
      <div className="mx-auto max-w-7xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#E43125]">
          Matchday
        </p>
        <h2 className="mb-8 text-3xl font-bold text-[#020022] sm:text-4xl">
          Next game
        </h2>

        {/* ------------------------------------------------------- the card */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100">
            <div className="flex flex-col md:flex-row">
              <div className="relative h-52 w-full shrink-0 bg-[#020022] md:h-auto md:w-2/5">
                <AnimatePresence mode="wait">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <motion.img
                    key={`${activeKey}-photo`}
                    src={photo.src}
                    alt={`${teamName(
                      current.ageGroup,
                      teams,
                      current.teamId
                    )} squad`}
                    className="absolute inset-0 h-full w-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-r from-[#020022]/45 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-[#E43125] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  Next game
                </span>
                <span className="absolute bottom-3 left-4 text-2xl font-extrabold text-white drop-shadow">
                  {current.ageGroup}
                </span>
              </div>

              <div className="flex w-full flex-col justify-center gap-2 p-6 sm:p-9 md:w-3/5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeKey}-text`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.06em] text-[#E43125] sm:text-sm">
                      {countdown ? `${countdown} · ` : ""}
                      {fixtureDay(current.kickoff)} ·{" "}
                      {fixtureTime(current.kickoff)}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold leading-tight text-[#020022] sm:text-3xl">
                      {teamName(current.ageGroup, teams, current.teamId)}{" "}
                      <span className="font-normal text-gray-400">
                        {current.isHome ? "vs" : "away to"}
                      </span>{" "}
                      {current.opponent}
                    </h3>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin size={14} aria-hidden />
                      {current.venue || "Venue to be confirmed"}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/matchday"
                    className="rounded-lg bg-[#E43125] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c4291f]"
                  >
                    Full schedule
                  </Link>
                  {/* One tap puts this game in a parent's phone. Downloads a
                      single event rather than subscribing them to everything —
                      the whole-season subscription is offered separately. */}
                  <button
                    type="button"
                    onClick={() =>
                      downloadIcs(
                        current,
                        teamName(current.ageGroup, teams, current.teamId)
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-[#020022] transition hover:bg-gray-50"
                  >
                    <CalendarPlus size={15} aria-hidden />
                    Add to calendar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {slides.length > 1 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.teamId ?? slide.ageGroup}
                  onClick={() => setIndex(i)}
                  aria-current={i === index}
                  aria-label={`Next game for ${slide.ageGroup}`}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    i === index
                      ? "border-[#020022] bg-[#020022] text-white"
                      : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {slide.ageGroup}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------- the list */}
        {list.length > 0 && (
          <div className="mt-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h3 className="text-xl font-bold text-[#020022]">Coming up</h3>
              <Link
                href="/matchday"
                className="text-sm font-semibold text-[#E43125] hover:underline"
              >
                Every fixture →
              </Link>
            </div>

            <ul className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              {list.map((f) => {
                const active = (f.teamId ?? f.ageGroup) === activeKey;
                return (
                  <li key={f.id}>
                    <button
                      onClick={() => jumpTo(f)}
                      className={`flex w-full items-center gap-4 border-b border-l-[3px] border-gray-100 px-4 py-3 text-left transition last:border-b-0 ${
                        active
                          ? "border-l-[#E43125] bg-[#fff5f4]"
                          : "border-l-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#020022] text-white">
                        <span className="text-base font-extrabold leading-none">
                          {fixtureDayNumber(f.kickoff)}
                        </span>
                        <span className="text-[9px] uppercase tracking-[0.09em] opacity-85">
                          {fixtureMonthShort(f.kickoff)}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-bold text-[#020022]">
                          <span
                            className={`mr-2 inline-block rounded px-1.5 py-0.5 text-[11px] font-extrabold ${
                              active
                                ? "bg-[#E43125] text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {f.ageGroup}
                          </span>
                          {f.isHome ? "vs" : "at"} {f.opponent}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {fixtureTime(f.kickoff)} ·{" "}
                          {f.venue || "Venue TBD"}
                        </span>
                      </span>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${
                          f.isHome
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {f.isHome ? "HOME" : "AWAY"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <CalendarDays size={13} aria-hidden />
                Tap a game to see that team&apos;s card above.
              </p>
              {/* Subscribe once and every future fixture, and every change to
                  one, arrives on its own. */}
              <a
                href={calendarSubscribeUrl()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E43125] hover:underline"
              >
                <CalendarPlus size={13} aria-hidden />
                Subscribe to the whole schedule
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default NextGameBoard;
