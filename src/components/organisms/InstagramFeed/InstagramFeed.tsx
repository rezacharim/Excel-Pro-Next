"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchAllImages } from "@/services/getAllImages";

const INSTAGRAM_URL = "https://www.instagram.com/excel.pro.soccer.academy";
const INSTAGRAM_HANDLE = "@excel.pro.soccer.academy";

interface GalleryImage {
  id: string;
  title?: string;
  image_url: string;
  created_at?: string;
}

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

/**
 * "Latest from our Instagram" wall on the home page.
 *
 * The tiles are fed from the academy's own Gallery (Dashboard -> Gallery),
 * so the academy controls exactly which 9 action shots appear — upload the
 * same photos you post on Instagram and the wall stays fresh. Every tile
 * links to the Instagram profile. (Instagram's old public-feed embed API was
 * retired by Meta, so a self-managed wall is the reliable, free approach.)
 */
const InstagramFeed = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchAllImages();
      if (cancelled) return;
      const list: GalleryImage[] = Array.isArray(data) ? data : [];
      const sorted = [...list].sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
      setImages(sorted.filter((i) => i.image_url).slice(0, 9));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide the whole section until we actually have photos to show.
  if (!loaded || images.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-red-50 text-primary text-sm font-medium mb-4">
            Follow our journey
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Latest from our Instagram
          </h2>
          <p className="mt-3 text-gray-600">
            Training sessions, match days and player moments —{" "}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              {INSTAGRAM_HANDLE}
            </a>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {images.map((img, index) => (
            <motion.a
              key={img.id ?? index}
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open our Instagram page${img.title ? ` — ${img.title}` : ""}`}
              className="group relative block aspect-square overflow-hidden rounded-lg bg-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (index % 3) * 0.08 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={img.title || "Excel Pro Soccer Academy activity"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/40">
                <InstagramIcon className="h-8 w-8 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </motion.a>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#c9281e] text-white rounded-full font-medium transition-colors"
          >
            <InstagramIcon className="h-5 w-5" />
            Follow us on Instagram
          </a>
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
