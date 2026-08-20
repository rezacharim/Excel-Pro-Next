"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import Story from "@/components/molecules/Story/Story";
import PhotoGallery from "@/components/molecules/PhotoGallery/PhotoGallery";
import {
  CATEGORY_LABELS,
  formatPostDate,
  postStory,
  type Post,
} from "@/services/news";

const BADGE_STYLE: Record<string, string> = {
  league: "bg-[#E43125] text-white",
  trial: "bg-[#020022] text-white",
  match: "bg-[#020022] text-white",
  medal: "bg-amber-500 text-white",
  interview: "bg-emerald-600 text-white",
  news: "bg-gray-200 text-gray-700",
};

const NewsPost = ({ post }: { post: Post }) => {
  const photos = (post.photos ?? []).filter((p) => p?.url);
  const hero = post.imageUrl;
  // The date of the match matters more than the date it got typed up.
  const shownDate = formatPostDate(post.eventDate || post.createdAt);

  // Long-form story if there is one, otherwise the short body — an older
  // notice written entirely in the body field is still a full post.
  const story = postStory(post);
  // Only show the short body as a standing lead when it is genuinely a summary
  // of something longer. When the body IS the story, printing it here and
  // again below would show the same words twice.
  const lead = (post.fullBody ?? "").trim() ? post.body : "";

  return (
    <section className="bg-white">
      {/* Header */}
      <div className="bg-[#FFF3F2] bg-[url('/images/other/tech-bg.png')] bg-cover bg-center px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center text-sm text-gray-500 my-4 flex-wrap">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/announcements" className="hover:text-gray-700">
              News &amp; Trials
            </Link>
            <span className="mx-2">/</span>
            <span className="text-red-500 font-medium line-clamp-1">
              {post.title}
            </span>
          </div>
        </div>
      </div>

      {/* Headline card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <motion.div
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {hero && (
            <div className="relative w-full h-56 sm:h-80 bg-gray-100">
              {hero.startsWith("/") ? (
                <Image
                  src={hero}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 896px"
                  className="object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hero}
                  alt={post.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>
          )}
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${
                  BADGE_STYLE[post.category] ?? BADGE_STYLE.news
                }`}
              >
                {CATEGORY_LABELS[post.category] ?? "News"}
              </span>
              {shownDate && (
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                  <Calendar size={14} />
                  {shownDate}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl sm:text-4xl font-bold text-[#020022]">
              {post.title}
            </h1>
            {lead && (
              <p className="mt-4 text-gray-600 leading-relaxed whitespace-pre-line">
                {lead}
              </p>
            )}
            {post.ctaUrl && post.ctaLabel && (
              <Link
                href={post.ctaUrl}
                className="inline-block mt-6 px-6 py-3 bg-[#E43125] hover:bg-[#c9281e] text-white rounded-md text-sm font-medium"
              >
                {post.ctaLabel}
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      {/* Full story */}
      {story && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Story text={story} />
        </div>
      )}

      {/* Gallery */}
      {photos.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-4">
          <PhotoGallery photos={photos} subject={post.title} />
        </div>
      )}

      {/* CTA */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-center">
        <Link
          href="/announcements"
          className="inline-block px-6 py-3 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to all news
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

export default NewsPost;
