"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLeagueSeason, type LeagueSeason } from "@/services/league";
import { FREE_SESSION, IMODEL, SEASONS, TRIALS_PATH } from "@/data/academy";

/**
 * What a family can sign up for right now, built from the live pages rather
 * than from posts. A post has to be edited by hand when its dates pass; these
 * rows cannot go stale — indoor reads the season record, trials read
 * src/data/academy.ts.
 */

interface Row {
  key: string;
  badge: string;
  title: string;
  text: string;
  href: string;
  cta: string;
}

const LiveOpenings = () => {
  const [indoor, setIndoor] = useState<LeagueSeason | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLeagueSeason("indoor")
      .then((s) => !cancelled && setIndoor(s))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: Row[] = [];
  if (indoor?.registrationOpen) {
    const started =
      !!indoor.startsOn &&
      Date.now() >= new Date(`${indoor.startsOn}T00:00:00`).getTime();
    rows.push({
      key: "indoor",
      badge: "Indoor Season",
      title: started
        ? `${indoor.name ?? "Indoor Season"} — on now, new players welcome`
        : `${indoor.name ?? "Indoor Season"} — registration open`,
      text: `Two sessions a week at ${SEASONS.indoor.venue.name}, ages 6 to 18.`,
      href: "/indoor",
      cta: started ? "Join the season" : "Reserve a spot",
    });
  }
  if (IMODEL.open) {
    rows.push({
      key: "imodel",
      badge: "Trials",
      title: `${IMODEL.name} trials — ${IMODEL.agesText}`,
      text: `A selected squad trained all winter at ${SEASONS.indoor.venue.name} for the ${IMODEL.league}. The trial is free.`,
      href: `${TRIALS_PATH}?for=imodel`,
      cta: "Book a trial",
    });
  }
  if (FREE_SESSION.open) {
    rows.push({
      key: "free",
      badge: "Free session",
      title: "Try a session for free — ages 6 to 18",
      text: "New to Excel Pro? Come to one regular training session with your child's age group, on us.",
      href: `${TRIALS_PATH}?for=free`,
      cta: "Book a free session",
    });
  }

  return (
    <>
      {rows.map((r) => (
        <div
          key={r.key}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <span className="mb-1.5 inline-block rounded-full bg-[#E43125] px-2.5 py-0.5 text-xs font-semibold text-white">
                {r.badge}
              </span>
              <h3 className="text-base font-bold leading-snug text-[#020022] sm:text-lg">
                {r.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{r.text}</p>
            </div>
            <Link
              href={r.href}
              className="shrink-0 rounded-lg bg-[#E43125] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#c4291f]"
            >
              {r.cta}
            </Link>
          </div>
        </div>
      ))}
    </>
  );
};

export default LiveOpenings;
