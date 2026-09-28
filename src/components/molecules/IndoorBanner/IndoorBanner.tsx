"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLeagueSeason, type LeagueSeason } from "@/services/league";

/**
 * Site-wide strip above the header advertising indoor registration.
 *
 * Everything it shows comes from the season record, so prices and dates are
 * changed in the dashboard, not here. It renders nothing while loading, when
 * the API is unreachable, or once the reservation deadline has passed — so
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

  // Shown for as long as the academy is taking indoor registrations. It used
  // to disappear on the reservation deadline even though registration stayed
  // open — the one strip pointing parents to /indoor vanished in the busiest
  // week. Now it retires when registration is closed or the season has begun.
  if (!season || !season.registrationOpen) return null;
  if (
    season.startsOn &&
    Date.now() > new Date(`${season.startsOn}T23:59:59`).getTime()
  ) {
    return null;
  }
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
      <span className="hidden sm:inline">
        {season.name ?? "Indoor Season"}
        {starts ? ` starts ${starts}` : ""} —{" "}
        {deposit ? `a ${deposit} deposit reserves your child's spot` : "reserve your child's spot"}
        {pastDeadline ? " · registration still open" : due ? ` · deadline ${due}` : ""} →
      </span>
      <span className="sm:hidden">
        Indoor Season{deposit ? ` — reserve with ${deposit}` : ""}
        {pastDeadline ? " — still open" : due ? ` by ${due}` : ""} →
      </span>
    </Link>
  );
};

export default IndoorBanner;
