"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ApiCoach, CoachPhoto } from "@/services/coaches";

/**
 * Local paths go through next/image for optimisation; anything on another host
 * (a photo uploaded through the dashboard, which lands in Supabase storage)
 * uses a plain img. next/image throws at runtime for a domain that is not in
 * next.config.mjs, which would blank the whole page — not acceptable for a
 * picture.
 */
const Picture = ({
  src,
  alt,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}) =>
  src.startsWith("/") ? (
    <Image src={src} alt={alt} fill sizes={sizes} className={className} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`absolute inset-0 ${className ?? ""}`} />
  );

const CoachProfile = ({ coach }: { coach: ApiCoach }) => {
  const photos: CoachPhoto[] = (coach.photos ?? []).filter((p) => p?.url);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (delta: number) =>
      setLightbox((current) =>
        current === null
          ? null
          : (current + delta + photos.length) % photos.length
      ),
    [photos.length]
  );

  // Arrow keys and Escape, because a gallery that can only be driven by
  // clicking small arrows is annoying on a laptop.
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, close, step]);

  const paragraphs = (coach.longBio ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const heroSrc = coach.imageUrl || "/images/person/avatars/Avatar1.png";

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
            <Picture
              src={heroSrc}
              alt={`${coach.name} — ${coach.role}`}
              sizes="(max-width: 640px) 100vw, 256px"
              className="w-full h-full object-cover object-top"
            />
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
      {paragraphs.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-xl font-bold text-[#020022] mb-4">
            From player to coach
          </h2>
          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-gray-700 leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {photos.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-xl font-bold text-[#020022] mb-4">Photos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, i) => (
              <button
                key={`${photo.url}-${i}`}
                onClick={() => setLightbox(i)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E43125]"
                aria-label={photo.caption || `Photo ${i + 1} of ${coach.name}`}
              >
                <Picture
                  src={photo.url}
                  alt={photo.caption || `${coach.name} photo ${i + 1}`}
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {photo.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2 text-left">
                    {photo.caption}
                  </span>
                )}
              </button>
            ))}
          </div>
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

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X size={28} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-2 sm:left-6 p-2 text-white/80 hover:text-white"
                aria-label="Previous photo"
              >
                <ChevronLeft size={36} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-2 sm:right-6 p-2 text-white/80 hover:text-white"
                aria-label="Next photo"
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}

          <figure
            className="max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Always a plain img here: the lightbox shows the photo at its own
                aspect ratio, which next/image's fill layout cannot do. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightbox].url}
              alt={photos[lightbox].caption || `${coach.name} photo`}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
            {photos[lightbox].caption && (
              <figcaption className="mt-3 text-center text-sm text-white/80">
                {photos[lightbox].caption}
              </figcaption>
            )}
            {photos.length > 1 && (
              <p className="mt-1 text-center text-xs text-white/50">
                {lightbox + 1} of {photos.length}
              </p>
            )}
          </figure>
        </div>
      )}
    </section>
  );
};

export default CoachProfile;
