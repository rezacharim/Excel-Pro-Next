import Programs from '@/components/organisms/Programs/Programs';
import { PRICING } from '@/data/programs';
import {
  CURRENT_SEASON,
  REGISTER_PATH,
  VENUE,
  FREE_SESSION,
  IMODEL,
  TRIALS_PATH,
  seasonHasStarted,
  seasonTimingText,
} from '@/data/academy';
import Link from 'next/link';
import React from 'react'

const Program = () => {
  return (
    <section className="mx-8">
        {/* Pricing banner */}
        <div className="max-w-7xl mx-auto mb-8 bg-white border border-gray-100 rounded-xl shadow-sm p-6 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {PRICING.price}{" "}
            <span className="text-base font-medium text-gray-600">
              / {PRICING.term} ({PRICING.currency}) — all divisions
            </span>
          </p>
          <p className="mt-2 text-gray-600 text-sm">
            {PRICING.registrationFeeLine}
          </p>
          {CURRENT_SEASON.joinLine && (
            <p className="mx-auto mt-3 max-w-3xl rounded-lg bg-red-50 px-4 py-2 text-sm text-gray-800">
              {CURRENT_SEASON.joinLine}
            </p>
          )}
          <p className="mt-1 text-primary text-sm font-medium">
            E-transfer accepted
          </p>
          <p className="mt-4 pt-4 border-t border-gray-100 text-gray-800 text-sm sm:text-base">
            <span className="font-semibold">{CURRENT_SEASON.name}</span>{" "}
            {seasonTimingText()} ·
            two sessions a week for every age group at{" "}
            <a
              href={VENUE.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline"
            >
              {VENUE.name}
            </a>{" "}
            ({VENUE.address})
          </p>
          <Link
            href={REGISTER_PATH}
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white"
          >
            {seasonHasStarted() ? "Join the season" : "Reserve a spot"}
          </Link>
          {FREE_SESSION.open && (
            <p className="mt-3 text-sm text-gray-600">
              Not sure yet?{" "}
              <Link href={`${TRIALS_PATH}?for=free`} className="font-semibold text-primary underline">
                Try a free session first
              </Link>
              {IMODEL.open && (
                <>
                  {" "}·{" "}
                  <Link href={`${TRIALS_PATH}?for=imodel`} className="font-semibold text-primary underline">
                    {IMODEL.name} trials ({IMODEL.agesText})
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
        <Programs />
    </section>
  )
}

export default Program;
