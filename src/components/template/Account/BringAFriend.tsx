"use client";

import { useState } from "react";
import {
  REFERRAL,
  SEASONS,
  friendInviteUrl,
  friendTrialUrl,
  whatsappShareHref,
} from "@/data/academy";
import type { PortalReferral } from "@/services/portal";

/**
 * Referral program card in a parent's account.
 *
 * Every friend or relative who registers and pays for the Indoor Season
 * through the family's link earns the child a private session with Coach
 * Reza Abedian at his gym — one per friend. The card shows the link, one-tap
 * sharing, and the family's progress: who joined, sessions earned, booked
 * and done. The link holds only a player id, never a name.
 */

const message = (url: string, trialUrl: string) =>
  `My child trains at Excel Pro Soccer Academy and we love it. The indoor season is on at ${SEASONS.indoor.venue.name} and new players can still join (ages 6–18). Register here: ${url}\n` +
  `Want to try first? Book a free session: ${trialUrl}\n\n` +
  `فرزند من در آکادمی فوتبال Excel Pro تمرین می‌کند. فصل Indoor در Richmond Hill Green Dome شروع شده و هنوز می‌توانید ثبت‌نام کنید (۶ تا ۱۸ سال). ثبت‌نام: ${url}`;

const REWARD_LABEL: Record<NonNullable<PortalReferral["reward"]>, string> = {
  earned: "Session earned — we'll arrange a date with you",
  booked: "Session booked",
  done: "Session done",
};

const BringAFriend = ({
  playerId,
  playerName,
  referrals,
}: {
  playerId: number;
  playerName: string;
  referrals: PortalReferral[];
}) => {
  const url = friendInviteUrl(playerId);
  const trialUrl = friendTrialUrl(playerId);
  const [copied, setCopied] = useState(false);
  const first = (playerName || "your child").split(" ")[0];

  const earned = referrals.filter((r) => r.reward).length;
  const pending = referrals.filter((r) => !r.joined).length;

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
        title: "Join Excel Pro Soccer Academy",
        text: message(url, trialUrl),
      });
    } catch {
      /* closed the share sheet */
    }
  };

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  if (!REFERRAL.open) return null;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-gray-100">
      <div className="bg-[#020022] px-5 py-6 text-white sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E43125]">
          Bring a friend
        </p>
        <h2 className="mt-1 text-xl font-bold sm:text-2xl">
          Earn a private session with {REFERRAL.coach}
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          For every friend or family member who registers for the Indoor Season
          through your link, {first} gets {REFERRAL.reward} {REFERRAL.where}.
          No limit — two friends, two sessions.
        </p>

        {/* progress */}
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-white/10 px-2 py-3">
            <p className="text-2xl font-bold">{referrals.length}</p>
            <p className="text-xs text-gray-300">friends signed up</p>
          </div>
          <div className="rounded-lg bg-white/10 px-2 py-3">
            <p className="text-2xl font-bold">{pending}</p>
            <p className="text-xs text-gray-300">waiting to pay</p>
          </div>
          <div className="rounded-lg bg-[#E43125] px-2 py-3">
            <p className="text-2xl font-bold">{earned}</p>
            <p className="text-xs text-white/90">
              private session{earned === 1 ? "" : "s"} earned
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <p className="text-sm font-semibold text-gray-900">How it works</p>
        <ol className="mt-2 space-y-1 text-sm text-gray-600">
          <li>1. Share your link with friends or family.</li>
          <li>2. They register their child for the Indoor Season and pay.</li>
          <li>3. We email you and arrange {first}&apos;s session — date and time agreed with you.</li>
        </ol>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={whatsappShareHref(message(url, trialUrl))}
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
            {copied ? "Link copied ✓" : "Copy my link"}
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
        <p className="mt-2 break-all text-xs text-gray-400">{url}</p>

        {referrals.length > 0 && (
          <ul className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
            {referrals.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="font-medium text-gray-800">{r.friend}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    r.reward
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {r.reward ? REWARD_LABEL[r.reward] : "Registered — waiting for payment"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-gray-400">
          Counts for new players registering for the Indoor Season through your
          link. Friends can also{" "}
          <a href={trialUrl} className="underline">
            try a free session first
          </a>{" "}
          — it still counts when they register.
        </p>
      </div>
    </div>
  );
};

export default BringAFriend;
