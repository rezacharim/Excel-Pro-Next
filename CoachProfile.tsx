"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Story from "@/components/molecules/Story/Story";
import PhotoGallery from "@/components/molecules/PhotoGallery/PhotoGallery";
import type { ApiCoach } from "@/services/coaches";

const CoachProfile = ({ coach }: { coach: ApiCoach }) => {
  const heroSrc = coach.imageUrl || "/images/person/avatars/Avatar1.png";
  const hasStory = Boolean(coach.longBio?.trim());
  const photos = (coach.photos ?? []).filter((p) => p?.url);

  return (
    <section className="bg-white">
      {/* Header */}
      <div className="bg-[#FFF3F2] bg-[url('/images/other/tech-bg.png')] bg-cover bg-center px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center text-sm text-gray-500 my-4 flex-wrap">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/coaches" className="hover:text-gray-700">
              Coaches
            </Link>
            <span className="mx-2">/</span>
            <span className="text-red-500 font-medium">{coach.name}</span>
          </div>
        </div>
      </div>

      {/* Identity card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-4">
        <motion.div
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sm:flex"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-full sm:w-64 h-72 sm:h-auto sm:min-h-[18rem] bg-gray-100 flex-shrink-0">
            {heroSrc.startsWith("/") ? (
              <Image
                src={heroSrc}
                alt={`${coach.name} — ${coach.role}`}
                fill
                sizes="(max-width: 640px) 100vw, 256px"
                className="w-full h-full object-cover object-top"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroSrc}
                alt={`${coach.name} — ${coach.role}`}
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
            )}
          </div>
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#020022]">
              {coach.name}
            </h1>
            <p className="mt-2 text-[#E43125] font-medium">{coach.role}</p>
            {coach.bio && (
              <p className="mt-4 text-gray-600 leading-relaxed">{coach.bio}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Story */}
      {hasStory && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Story text={coach.longBio ?? ""} fallbackHeading="From player to coach" />
        </div>
      )}

      {/* Gallery */}
      {photos.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <PhotoGallery photos={photos} subject={coach.name} />
        </div>
      )}

      {/* CTA */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-center">
        <Link
          href="/coaches"
          className="inline-block px-6 py-3 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to all coaches
        </Link>
        <Link
          href="/program"
          className="inline-block ml-3 px-6 py-3 bg-[#E43125] hover:bg-[#c9281e] text-white rounded-md text-sm font-medium"
        >
          View our programs
        </Link>
      </div>
    </section>
  );
};

export default CoachProfile;
