"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { Gift, Loader2, Mail, Phone, RefreshCw, Send, X } from "lucide-react";
import { REFERRAL } from "@/data/academy";

/**
 * Dashboard → Referrals.
 *
 * Families share their link (their account page, or the email sent from
 * here). A new player who registers for the Indoor Season through it is
 * recorded against that family; once the new family pays, the referring
 * family has earned a private session with Coach Reza Abedian — they get an
 * email and you get an alert. Book it, then mark it Booked and Done here.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const LINK_BASE = "https://www.excelproso.com/indoor?src=friend&ref=";

interface ReferralRow {
  registrationId: number;
  friend: string;
  friendAgeGroup: string;
  friendParent: string | null;
  friendStatus: string;
  createdAt: string;
  rewardStatus: "earned" | "booked" | "done" | null;
  referrer: {
    userId: number;
    player: string;
    parent: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

interface MemberRow {
  id: number;
  fullname: string;
  email: string;
  membershipStatus: string;
}

const REWARD: Record<string, { label: string; tone: string }> = {
  none: { label: "Waiting for payment", tone: "bg-amber-100 text-amber-800" },
  earned: { label: "Earned — to book", tone: "bg-[#E43125] text-white" },
  booked: { label: "Booked", tone: "bg-blue-100 text-blue-800" },
  done: { label: "Done", tone: "bg-green-100 text-green-800" },
};

const ReferralsAdmin = () => {
  const token = Cookies.get("auth_token");
  const auth = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/league/admin/referrals`, { headers: auth });
      if (!res.ok) throw new Error("Could not load referrals");
      setRows(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    load();
  }, [load]);

  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 4000);
  };

  const setReward = async (row: ReferralRow, value: "earned" | "booked" | "done") => {
    const res = await fetch(`${API_URL}/league/admin/registrations/${row.registrationId}`, {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify({ referralRewardStatus: value }),
    });
    if (!res.ok) return say("Could not save — please try again");
    setRows((rs) =>
      rs.map((r) => (r.registrationId === row.registrationId ? { ...r, rewardStatus: value } : r))
    );
  };

  // One card per referring family, most sessions earned first.
  const families = useMemo(() => {
    const map = new Map<string, { key: string; ref: ReferralRow["referrer"]; items: ReferralRow[] }>();
    for (const r of rows) {
      const key = r.referrer?.email || `#${r.referrer?.userId ?? "unknown"}`;
      const f = map.get(key) ?? { key, ref: r.referrer, items: [] };
      f.items.push(r);
      map.set(key, f);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        b.items.filter((i) => i.rewardStatus).length - a.items.filter((i) => i.rewardStatus).length
    );
  }, [rows]);

  const toBook = rows.filter((r) => r.rewardStatus === "earned").length;
  const joined = rows.filter((r) => r.rewardStatus).length;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
          <p className="text-sm text-gray-500">
            Families who brought a friend into the Indoor Season. Each paid friend earns them a private session with{" "}
            {REFERRAL.coach}.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={() => setAnnounce(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c9281e]"
          >
            <Send size={16} /> Email families their link
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { n: rows.length, l: "friends signed up" },
          { n: joined, l: "paid — sessions earned" },
          { n: toBook, l: "sessions to book" },
        ].map((c, i) => (
          <div key={i} className={`rounded-xl p-4 ring-1 ring-gray-200 ${i === 2 && toBook ? "bg-[#E43125] text-white" : "bg-white"}`}>
            <p className="text-2xl font-bold">{c.n}</p>
            <p className={`text-sm ${i === 2 && toBook ? "text-white/90" : "text-gray-500"}`}>{c.l}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="mr-2 animate-spin" size={18} /> Loading…
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : families.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center text-gray-500 ring-1 ring-gray-200">
          <Gift className="mx-auto mb-2 text-[#E43125]" />
          No referrals yet. Press &ldquo;Email families their link&rdquo; to launch the program — every family also sees
          their link in their account.
        </div>
      ) : (
        <div className="space-y-4">
          {families.map((f) => (
            <div key={f.key} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {f.ref ? `${f.ref.parent || "Family"} · ${f.ref.player}` : "Unknown family"}
                  </p>
                  {f.ref && (
                    <p className="mt-0.5 flex flex-wrap gap-x-4 text-sm text-gray-600">
                      {f.ref.phone && (
                        <a href={`tel:${f.ref.phone}`} className="inline-flex items-center gap-1 text-[#E43125]">
                          <Phone size={14} /> {f.ref.phone}
                        </a>
                      )}
                      {f.ref.email && (
                        <a href={`mailto:${f.ref.email}`} className="inline-flex items-center gap-1 text-[#E43125]">
                          <Mail size={14} /> {f.ref.email}
                        </a>
                      )}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-[#020022] px-3 py-1 text-sm font-semibold text-white">
                  {f.items.filter((i) => i.rewardStatus).length} session
                  {f.items.filter((i) => i.rewardStatus).length === 1 ? "" : "s"} earned
                </span>
              </div>
              <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
                {f.items.map((r) => {
                  const tone = REWARD[r.rewardStatus ?? "none"];
                  return (
                    <li key={r.registrationId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span>
                        <strong>{r.friend}</strong> <span className="text-gray-500">· {r.friendAgeGroup}</span>
                        {r.friendParent ? <span className="text-gray-500"> · parent {r.friendParent}</span> : null}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone.tone}`}>{tone.label}</span>
                        {r.rewardStatus && (
                          <select
                            value={r.rewardStatus}
                            onChange={(e) => setReward(r, e.target.value as "earned" | "booked" | "done")}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                            aria-label="Private session status"
                          >
                            <option value="earned">Earned — to book</option>
                            <option value="booked">Booked</option>
                            <option value="done">Done</option>
                          </select>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {announce && (
        <AnnounceDialog
          auth={auth}
          onClose={() => setAnnounce(false)}
          onSent={(n) => {
            setAnnounce(false);
            say(`Referral link emailed to ${n} famil${n === 1 ? "y" : "ies"}`);
          }}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[#020022] px-4 py-3 text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
};

/** Email every active family their own referral link. */
const AnnounceDialog = ({
  auth,
  onClose,
  onSent,
}: {
  auth: Record<string, string>;
  onClose: () => void;
  onSent: (families: number) => void;
}) => {
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/membership/overview`, { headers: auth })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load members"))))
      .then((all: MemberRow[]) => setMembers(all.filter((m) => m.membershipStatus === "active" && m.email)))
      .catch((e: Error) => setError(e.message));
  }, [auth]);

  const familyCount = members ? new Set(members.map((m) => m.email.trim().toLowerCase())).size : 0;

  const send = async () => {
    if (!members?.length) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/membership/announce-referral`, {
        method: "POST",
        headers: auth,
        body: JSON.stringify({ userIds: members.map((m) => m.id), linkBase: LINK_BASE }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Could not send");
      onSent(data.sent ?? 0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={20} />
        </button>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Gift size={18} className="text-[#E43125]" /> Launch the referral program
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {members === null
            ? "Counting active families…"
            : `${familyCount} active famil${familyCount === 1 ? "y" : "ies"} will get one email each, with their own link.`}
        </p>
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
          <p className="font-semibold text-gray-900">Bring a friend — earn a private session with {REFERRAL.coach}</p>
          <p className="mt-2">
            For every friend or family member who registers their child for the Indoor Season through your link,
            [child] gets {REFERRAL.reward} {REFERRAL.where}. No limit — two friends, two sessions.
          </p>
          <p className="mt-2">How it works: share your link → they register and pay → we email you and book the session.</p>
          <p className="mt-2">[their personal link] · Share on WhatsApp button · Farsi version · unsubscribe line</p>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={send}
            disabled={busy || !members?.length}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy && <Loader2 className="animate-spin" size={16} />}
            Send to {familyCount} famil{familyCount === 1 ? "y" : "ies"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralsAdmin;
