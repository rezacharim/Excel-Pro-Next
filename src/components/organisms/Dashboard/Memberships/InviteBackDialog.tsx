"use client";

import { useState } from "react";
import { Heart, Loader2, X } from "lucide-react";
import { SEASONS, TRIALS_PATH } from "@/data/academy";

/**
 * Invitation type 1 — "we would love to see you back".
 *
 * For families who left for any reason, including not being happy with a
 * coach. The email does not guess the reason and blames nobody: it asks what
 * didn't work (replies come straight to the academy) and offers one free
 * session at the Green Dome. English and Farsi in one email.
 *
 * - One email per family — siblings sharing an address get one message.
 * - Families invited back in the last 30 days are skipped unless you tick
 *   "send again".
 * - Anyone whose internal note contains "unsubscribe" is never emailed — write
 *   that in their note when a parent asks to stop (Canada's anti-spam law).
 * - Every send is written into the player's internal note with the date.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SITE = "https://www.excelproso.com";

interface Result {
  sent: number;
  skipped: { fullname: string; reason: string }[];
  failed: { fullname: string; reason: string }[];
}

const InviteBackDialog = ({
  ids,
  names,
  token,
  onClose,
  onDone,
}: {
  ids: number[];
  /** Names of the chosen players, for the confirmation line. */
  names: string[];
  token: string | undefined;
  onClose: () => void;
  onDone: (message: string) => void;
}) => {
  const [note, setNote] = useState("");
  const [resend, setResend] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/membership/invite-back`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: ids,
          where: SEASONS.indoor.venue.name,
          bookUrl: `${SITE}${TRIALS_PATH}?for=free&src=comeback`,
          resend,
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          Array.isArray(data?.message) ? data.message.join(", ") : data?.message || "Could not send"
        );
      }
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const shown = names.slice(0, 4).join(", ") + (names.length > 4 ? ` and ${names.length - 4} more` : "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Invite back for a free session">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={20} />
        </button>

        {result ? (
          <>
            <h2 className="text-lg font-bold">Invitations sent</h2>
            <p className="mt-2 text-sm text-gray-700">
              <strong>{result.sent}</strong> famil{result.sent === 1 ? "y" : "ies"} emailed.
            </p>
            {result.skipped.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="font-medium text-gray-700">Skipped</p>
                <ul className="mt-1 list-disc pl-5 text-gray-600">
                  {result.skipped.map((s, i) => (
                    <li key={i}>{s.fullname} — {s.reason}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.failed.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="font-medium text-red-700">Not sent</p>
                <ul className="mt-1 list-disc pl-5 text-red-700">
                  {result.failed.map((s, i) => (
                    <li key={i}>{s.fullname} — {s.reason}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => onDone(`Come-back invitation sent to ${result.sent} famil${result.sent === 1 ? "y" : "ies"}`)}
                className="rounded-lg bg-[#E43125] px-4 py-2 text-sm font-medium text-white"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Heart size={18} className="text-[#E43125]" /> Invite back for a free session
            </h2>
            <p className="mt-1 text-sm text-gray-500">{shown}</p>

            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">What they receive (English + Farsi)</p>
              <p className="font-semibold text-gray-900">We would love to see [child] back</p>
              <p className="mt-2">It has been a while since [child] trained with us, and we have missed having them around.</p>
              <p className="mt-2">
                Families step away for all kinds of reasons — the schedule, the location, the coaching, or simply life getting
                busy. Whatever it was for you, we would honestly like to know, because it helps us do better. Just reply to
                this email; it comes straight to us and stays between us.
              </p>
              <p className="mt-2">
                We would also like to invite [child] to <strong>one free training session</strong> at {SEASONS.indoor.venue.name}{" "}
                this season — no cost and no commitment — to see how things are now.
              </p>
              {note.trim() && <p className="mt-2">{note.trim()}</p>}
              <p className="mt-3 inline-block rounded bg-[#E43125] px-3 py-1.5 text-xs font-bold text-white">Book a free session</p>
              <p className="mt-3 text-xs text-gray-500">+ an unsubscribe line at the bottom</p>
            </div>

            <label className="mt-4 block text-sm">
              <span className="mb-1 block text-gray-700">Add a personal line (optional)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Training is indoors at the Green Dome all winter."
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
              <span className="mt-1 block text-xs text-gray-500">Only write what is true for every family you ticked.</span>
            </label>

            <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={resend} onChange={(e) => setResend(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#E43125]" />
              Send again to families invited back in the last 30 days
            </label>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={send}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {busy && <Loader2 className="animate-spin" size={16} />}
                Send to {ids.length} player{ids.length === 1 ? "" : "s"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InviteBackDialog;
