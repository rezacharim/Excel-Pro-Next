"use client";

import { useState } from "react";
import {
  SEASONS,
  friendInviteUrl,
  whatsappShareHref,
} from "@/data/academy";

/**
 * "Bring a friend" — shown in a parent's account once they have a player.
 *
 * The family shares a link to a free session. When a friend books through it,
 * the booking arrives in Dashboard → Trials marked "Friend of <parent>
 * (<child>)", so the academy knows who to thank. The link holds only a player
 * id, never a name.
 */

const message = (url: string) =>
  `My child trains at Excel Pro Soccer Academy and we love it. They're offering your child a free session at ${SEASONS.indoor.venue.name} (ages 6–18). Book here: ${url}\n\n` +
  `فرزند من در آکادمی فوتبال Excel Pro تمرین می‌کند. یک جلسه‌ی تمرین رایگان برای فرزند شما هم هست. ثبت‌نام: ${url}`;

const BringAFriend = ({ playerId }: { playerId: number }) => {
  const url = friendInviteUrl(playerId);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const share = async () => {
    try {
      await navigator.share({
        title: "A free session at Excel Pro Soccer Academy",
        text: message(url),
      });
    } catch {
      /* closed the share sheet */
    }
  };

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-md sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Bring a friend
      </p>
      <h2 className="mt-1 text-lg font-bold text-gray-900">
        Give a friend a free session
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Know a family whose child would love soccer? Send them this link — their
        first session at {SEASONS.indoor.venue.name} is free, ages 6 to 18.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={whatsappShareHref(message(url))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5a]"
        >
          Share on WhatsApp
        </a>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary"
        >
          {copied ? "Link copied ✓" : "Copy link"}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={share}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary"
          >
            More ways to share
          </button>
        )}
      </div>
    </div>
  );
};

export default BringAFriend;
