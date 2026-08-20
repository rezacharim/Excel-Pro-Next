"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface GalleryPhoto {
  url: string;
  caption?: string;
}

/**
 * Local paths go through next/image for optimisation; anything on another host
 * (a photo uploaded through the dashboard, which lands in Supabase storage)
 * uses a plain img. next/image throws at runtime for a domain missing from
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

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  /** Used in alt text and screen-reader labels, e.g. the coach or post title. */
  subject: string;
  heading?: string;
}

const PhotoGallery = ({ photos, subject, heading = "Photos" }: PhotoGalleryProps) => {
  const usable = (photos ?? []).filter((p) => p?.url);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (delta: number) =>
      setLightbox((current) =>
        current === null ? null : (current + delta + usable.length) % usable.length
      ),
    [usable.length]
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

  if (usable.length === 0) return null;

  return (
    <>
      <h2 className="text-xl font-bold text-[#020022] mb-4">{heading}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {usable.map((photo, i) => (
          <button
            key={`${photo.url}-${i}`}
            onClick={() => setLightbox(i)}
            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E43125]"
            aria-label={photo.caption || `Photo ${i + 1} of ${subject}`}
          >
            <Picture
              src={photo.url}
              alt={photo.caption || `${subject} photo ${i + 1}`}
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

      {lightbox !== null && usable[lightbox] && (
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

          {usable.length > 1 && (
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

          <figure className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Always a plain img here: the lightbox shows the photo at its own
                aspect ratio, which next/image's fill layout cannot do. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={usable[lightbox].url}
              alt={usable[lightbox].caption || `${subject} photo`}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
            {usable[lightbox].caption && (
              <figcaption className="mt-3 text-center text-sm text-white/80">
                {usable[lightbox].caption}
              </figcaption>
            )}
            {usable.length > 1 && (
              <p className="mt-1 text-center text-xs text-white/50">
                {lightbox + 1} of {usable.length}
              </p>
            )}
          </figure>
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
