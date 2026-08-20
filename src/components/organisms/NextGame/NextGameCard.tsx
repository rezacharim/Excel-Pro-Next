"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, MapPin } from "lucide-react";
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
import { SITE_TEXT_DEFAULTS, type SiteText } from "@/services/siteText";

const ROTATE_MS = 6000;
/** Three keeps the card roughly the height of the news cards beside it. */
const LIST_LENGTH = 3;
const RESULT_LENGTH = 3;

/**
 * The compact home-page fixtures card.
 *
 * This is the sidebar form of NextGameBoard: same data, same rotation, same
 * calendar links, but sized to sit in a column beside the news instead of
 * taking a full-width band of its own. The full-width version cost roughly
 * 750px of page height for information that fits in 400px, which pushed
 * everything below it — programs, testimonials, contact — off the first
 * couple of screens.
 *
 * The team photo lives in the header band rather than in a panel of its own,
 * so each team is still recognisable without spending vertical space on it.
 */
const NextGameCard = ({
  fixtures,
  results = [],
  teams,
  text = SITE_TEXT_DEFAULTS,
}: {
  fixtures: Fixture[];
  /** Games already played, newest first. Shown with their score. */
  results?: Fixture[];
  teams: Team[];
  text?: SiteText;
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

  // Results are worth showing on their own at the end of a season, when there
  // is nothing left to play.
  if (slides.length === 0 && results.length === 0) return null;

  const current = slides.length
    ? slides[Math.min(index, slides.length - 1)]
    : null;
  const activeKey = current ? current.teamId ?? current.ageGroup : null;
  const photo = current
    ? teamPhoto(current.ageGroup, teams, current.teamId)
    : null;
  const countdown = current ? fixtureCountdown(current.kickoff) : "";

  // The game already shown in the card would only repeat itself in the list.
  const list = fixtures
    .filter((f) => !current || f.id !== current.id)
    .slice(0, LIST_LENGTH);

  const jumpTo = (fixture: Fixture) => {
    const key = fixture.teamId ?? fixture.ageGroup;
    const i = slides.findIndex((s) => (s.teamId ?? s.ageGroup) === key);
    if (i >= 0) setIndex(i);
  };

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#E43125]">
          {text["fixtures.eyebrow"]}
        </p>
        <h2 className="text-3xl font-bold text-[#020022] sm:text-4xl">
          {text["fixtures.heading"]}
        </h2>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        {current && (
          <>
            {/* ------------------------------------------- team photo band */}
            <div className="relative h-24 w-full bg-[#020022]">
              <AnimatePresence mode="wait">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <motion.img
                  key={`${activeKey}-photo`}
                  src={photo?.src}
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#020022]/85 via-[#020022]/30 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-[#E43125] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Next game
              </span>
              <span className="absolute bottom-2 left-3 text-xl font-extrabold text-white drop-shadow">
                {current.ageGroup}
              </span>
              {countdown && (
                <span className="absolute bottom-2.5 right-3 text-[11px] font-semibold text-white/85">
                  {countdown}
                </span>
              )}
            </div>

            {/* ------------------------------------------------ team pills */}
            {slides.length > 1 && (
              <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                {slides.map((slide, i) => (
                  <button
                    key={slide.teamId ?? slide.ageGroup}
                    onClick={() => setIndex(i)}
                    aria-current={i === index}
                    aria-label={`Next game for ${slide.ageGroup}`}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
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

            {/* ------------------------------------------------ the fixture */}
            <div className="px-4 pb-4 pt-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeKey}-text`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#E43125]">
                    {fixtureDay(current.kickoff)} ·{" "}
                    {fixtureTime(current.kickoff)}
                  </p>
                  <h3 className="mt-1 text-lg font-bold leading-snug text-[#020022]">
                    {teamName(current.ageGroup, teams, current.teamId)}{" "}
                    <span className="font-normal text-gray-400">
                      {current.isHome ? "vs" : "away to"}
                    </span>{" "}
                    {current.opponent}
                  </h3>
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-gray-600">
                    <MapPin size={13} className="mt-0.5 shrink-0" aria-hidden />
                    {current.venue || "Venue to be confirmed"}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-3 flex gap-2">
                <Link
                  href="/matchday"
                  className="flex-1 rounded-lg bg-[#E43125] px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-[#c4291f]"
                >
                  Full schedule
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    downloadIcs(
                      current,
                      teamName(current.ageGroup, teams, current.teamId)
                    )
                  }
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-[#020022] transition hover:bg-gray-50"
                >
                  <CalendarPlus size={13} aria-hidden />
                  Add to calendar
                </button>
              </div>
            </div>
          </>
        )}

        {/* --------------------------------------------------- coming up */}
        {list.length > 0 && (
          <ul className="border-t border-gray-100">
            {list.map((f) => {
              const active = (f.teamId ?? f.ageGroup) === activeKey;
              return (
                <li key={f.id}>
                  <button
                    onClick={() => jumpTo(f)}
                    className={`flex w-full items-center gap-2.5 border-b border-l-[3px] border-gray-100 px-4 py-2.5 text-left transition last:border-b-0 ${
                      active
                        ? "border-l-[#E43125] bg-[#fff5f4]"
                        : "border-l-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md bg-[#020022] text-white">
                      <span className="text-[13px] font-extrabold leading-none">
                        {fixtureDayNumber(f.kickoff)}
                      </span>
                      <span className="text-[8px] uppercase tracking-[0.08em] opacity-85">
                        {fixtureMonthShort(f.kickoff)}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-[#020022]">
                        <span
                          className={`mr-1.5 inline-block rounded px-1 py-0.5 text-[9px] font-extrabold ${
                            active
                              ? "bg-[#E43125] text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {f.ageGroup}
                        </span>
                        {f.isHome ? "vs" : "at"} {f.opponent}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-gray-500">
                        {fixtureTime(f.kickoff)} · {f.venue || "Venue TBD"}
                      </span>
                    </span>

                    <span
                      className={`shrink-0 text-[9px] font-extrabold tracking-wide ${
                        f.isHome ? "text-green-700" : "text-gray-400"
                      }`}
                    >
                      {f.isHome ? "HOME" : "AWAY"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* ----------------------------------------------- recent results */}
        {results.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Recent results
            </p>
            <div className="space-y-1.5">
              {results.slice(0, RESULT_LENGTH).map((f) => {
                const ours = f.ourScore ?? 0;
                const theirs = f.theirScore ?? 0;
                const known = f.ourScore != null && f.theirScore != null;
                const tone = !known
                  ? "bg-gray-100 text-gray-600"
                  : ours > theirs
                    ? "bg-green-50 text-green-700"
                    : ours < theirs
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700";
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 text-[12px]"
                  >
                    <span className="rounded bg-gray-100 px-1 py-0.5 text-[9px] font-extrabold text-gray-600">
                      {f.ageGroup}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-extrabold ${tone}`}
                    >
                      {known ? `${ours}–${theirs}` : "–"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[#020022]">
                      <span className="text-gray-400">
                        {f.isHome ? "vs" : "at"}
                      </span>{" "}
                      {f.opponent}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- footer */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-2.5">
          <Link
            href="/matchday"
            className="text-[11px] font-bold text-[#E43125] hover:underline"
          >
            Every fixture →
          </Link>
          {/* Subscribe once and every future fixture, and every change to one,
              arrives on its own. */}
          <a
            href={calendarSubscribeUrl()}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-[#E43125] hover:underline"
          >
            <CalendarPlus size={12} aria-hidden />
            Subscribe
          </a>
        </div>
      </div>
    </div>
  );
};

export default NextGameCard;
