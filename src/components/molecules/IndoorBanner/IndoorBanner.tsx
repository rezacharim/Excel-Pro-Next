"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLeagueSeason, type LeagueSeason } from "@/services/league";
import { SEASONS } from "@/data/academy";

const VENUE = SEASONS.indoor.venue;

/**
 * Site-wide strip above the header advertising indoor registration.
 *
 * Everything it shows comes from the season record, so prices and dates are
 * changed in the dashboard, not here. It renders nothing while loading, when
 * the API is unreachable, or once indoor registration is switched off — so
 * the campaign retires itself without a code change.
 */
const shortDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-CA", {
    month: "long",
    day: "numeric",
  });
};

const IndoorBanner = () => {
  const [season, setSeason] = useState<LeagueSeason | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLeagueSeason("indoor")
      .then((s) => {
        if (!cancelled) setSeason(s);
      })
      .catch(() => {
        /* no season, no banner */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Shown for as long as the academy is taking indoor registrations — before
  // AND after the first session. It used to vanish on the start date, and the
  // pages that stayed up kept saying "starts October 5"; parents read a date in
  // the past as "too late" and stopped asking. Once the season is under way the
  // strip says so and invites new players instead. It retires when
  // registration is switched off in Dashboard → League → Indoor → Settings.
  if (!season || !season.registrationOpen) return null;

  const started =
    !!season.startsOn &&
    Date.now() >= new Date(`${season.startsOn}T00:00:00`).getTime();
  const pastDeadline =
    !!season.firstPaymentDue &&
    Date.now() > new Date(`${season.firstPaymentDue}T23:59:59`).getTime();

  const starts = shortDate(season.startsOn);
  const due = shortDate(season.firstPaymentDue);
  const deposit = season.depositAmount
    ? `$${Number(season.depositAmount).toFixed(0)}`
    : null;

  return (
    <Link
      href="/indoor"
      className="block bg-[#E43125] px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[#c4291f]"
    >
      {started ? (
        <>
          <span className="hidden sm:inline">
            {season.name ?? "Indoor Season"} is on now at {VENUE.name} — new
            players can still join, register online →
          </span>
          <span className="sm:hidden">
            Indoor season on now — new players can still join →
          </span>
        </>
      ) : (
        <>
          <span className="hidden sm:inline">
            {season.name ?? "Indoor Season"}
            {starts ? ` starts ${starts}` : ""} —{" "}
            {deposit
              ? `a ${deposit} deposit reserves your child's spot`
              : "reserve your child's spot"}
            {pastDeadline
              ? " · registration still open"
              : due
                ? ` · deadline ${due}`
                : ""}{" "}
            →
          </span>
          <span className="sm:hidden">
            Indoor Season{deposit ? ` — reserve with ${deposit}` : ""}
            {pastDeadline ? " — still open" : due ? ` by ${due}` : ""} →
          </span>
        </>
      )}
    </Link>
  );
};

export default IndoorBanner;
