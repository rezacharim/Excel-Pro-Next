import Programs from '@/components/organisms/Programs/Programs';
import { PRICING } from '@/data/programs';
import { CURRENT_SEASON, VENUE } from '@/data/academy';
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
          <p className="mt-1 text-primary text-sm font-medium">
            E-transfer accepted
          </p>
          <p className="mt-4 pt-4 border-t border-gray-100 text-gray-800 text-sm sm:text-base">
            <span className="font-semibold">{CURRENT_SEASON.name}</span> starts{" "}
            <span className="font-semibold">{CURRENT_SEASON.startsOn}</span> ·
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
            href="/indoor"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white"
          >
            Reserve a spot
          </Link>
        </div>
        <Programs />
    </section>
  )
}

export default Program;
