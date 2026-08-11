"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { sponsors, Sponsor, SponsorTier } from "@/data/sponsors";

const ACADEMY_EMAIL = "excelprosocceracademy@gmail.com";
const ACADEMY_PHONE_DISPLAY = "+1 647-703-7821";
const ACADEMY_PHONE_TEL = "+16477037821";

const tierOrder: SponsorTier[] = ["gold", "silver", "community"];

const tierConfig: Record<
  SponsorTier,
  { title: string; gridClass: string; cardClass: string; logoClass: string }
> = {
  gold: {
    title: "Gold Sponsors",
    gridClass: "grid grid-cols-1 sm:grid-cols-2 gap-6",
    cardClass: "p-10",
    logoClass: "h-28",
  },
  silver: {
    title: "Silver Sponsors",
    gridClass: "grid grid-cols-2 sm:grid-cols-3 gap-6",
    cardClass: "p-8",
    logoClass: "h-20",
  },
  community: {
    title: "Community Partners",
    gridClass: "grid grid-cols-2 sm:grid-cols-4 gap-6",
    cardClass: "p-6",
    logoClass: "h-14",
  },
};

const benefits = [
  {
    title: "Your logo on jerseys & website",
    text: "Your brand travels with our teams - on match jerseys, training gear and right here on our website, all season long.",
  },
  {
    title: "Visibility to hundreds of GTA families",
    text: "Reach an engaged local audience of parents and players across Markham, Toronto and the GTA at every practice, match and event.",
  },
  {
    title: "Real community impact",
    text: "Your support keeps quality soccer training accessible and helps young players ages 5 to 18 grow on and off the field.",
  },
];

const SponsorCard = ({
  sponsor,
  tier,
  index,
}: {
  sponsor: Sponsor;
  tier: SponsorTier;
  index: number;
}) => {
  const config = tierConfig[tier];

  const card = (
    <motion.div
      className={`bg-white rounded-xl shadow-md border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow ${config.cardClass}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
    >
      <div className={`relative w-full ${config.logoClass}`}>
        <Image
          src={sponsor.logo}
          alt={`${sponsor.name} logo`}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-contain"
        />
      </div>
      <p className="mt-4 text-sm font-medium text-gray-900">{sponsor.name}</p>
    </motion.div>
  );

  return sponsor.url ? (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${sponsor.name} website`}
    >
      {card}
    </a>
  ) : (
    card
  );
};

const Sponsors = () => {
  const hasSponsors = sponsors.length > 0;

  return (
    <section className="bg-white overflow-hidden">
      {/* Hero */}
      <motion.div
        className="bg-[#FFF3F2] bg-[url('/images/other/tech-bg.png')] bg-cover bg-center px-4 sm:px-6 lg:px-8 pt-8 pb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex items-center text-sm text-gray-500 my-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-red-500 font-medium">Sponsors</span>
          </motion.div>

          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <motion.span
              className="inline-block px-3 py-1 bg-red-100 text-red-500 text-sm font-medium rounded-xl mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Our Partners
            </motion.span>
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Our Sponsors &amp; Partners
            </motion.h1>
            <motion.p
              className="mt-4 text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              Local businesses helping young players grow.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        {hasSponsors ? (
          /* Logo grid grouped by tier */
          <div className="space-y-12">
            {tierOrder.map((tier) => {
              const tierSponsors = sponsors.filter((s) => s.tier === tier);
              if (tierSponsors.length === 0) return null;
              const config = tierConfig[tier];
              return (
                <div key={tier}>
                  <motion.h2
                    className="text-2xl font-bold text-gray-900 text-center mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    {config.title}
                  </motion.h2>
                  <div className={config.gridClass}>
                    {tierSponsors.map((sponsor, index) => (
                      <SponsorCard
                        key={sponsor.name}
                        sponsor={sponsor}
                        tier={tier}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state: become our first sponsor */
          <motion.div
            className="bg-white rounded-xl shadow-md border border-gray-100 px-6 py-14 text-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 bg-red-100 text-red-500 text-sm font-medium rounded-xl mb-4">
              This space is waiting for you
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Become our first sponsor
            </h2>
            <p className="mt-4 text-gray-600 max-w-xl mx-auto leading-relaxed">
              We are opening our sponsorship program to local businesses that
              want to stand behind youth soccer in Markham and the GTA. Your
              brand could be the first one families see here - and on our
              jerseys.
            </p>
          </motion.div>
        )}

        {/* Become a Sponsor */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            Become a Sponsor
          </h2>
          <p className="mt-2 text-gray-600 text-center max-w-2xl mx-auto">
            Partner with Excel Pro Soccer Academy and grow your business while
            supporting young athletes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
            {benefits.map((benefit, index) => (
              <motion.article
                key={benefit.title}
                className="bg-white rounded-xl shadow-md border border-gray-100 p-6 text-center"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
              >
                <h3 className="text-lg font-bold text-gray-900">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {benefit.text}
                </p>
              </motion.article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/contact-us"
              className="inline-block px-8 py-3 bg-primary hover:bg-[#c9281e] text-white rounded-md font-medium transition-colors"
            >
              Sponsor Excel Pro
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              Or reach us directly:{" "}
              <a
                href={`mailto:${ACADEMY_EMAIL}`}
                className="text-primary hover:underline font-medium"
              >
                {ACADEMY_EMAIL}
              </a>{" "}
              |{" "}
              <a
                href={`tel:${ACADEMY_PHONE_TEL}`}
                className="text-primary hover:underline font-medium"
              >
                {ACADEMY_PHONE_DISPLAY}
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Sponsors;
