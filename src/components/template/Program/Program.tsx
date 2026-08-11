import Programs from '@/components/organisms/Programs/Programs';
import { PRICING } from '@/data/programs';
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
        </div>
        <Programs />
    </section>
  )
}

export default Program;
