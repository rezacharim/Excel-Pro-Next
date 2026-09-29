"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Loader2, Plus, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const isEmail = (v: string) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(v.trim());

/**
 * Dashboard → Settings → Notifications.
 *
 * Who gets an email when a family registers (website form, Winter League,
 * Indoor) or starts / confirms an e-transfer. Stored as the `notifyEmails`
 * academy setting, so changing it needs no developer and no deploy.
 */
const NotificationEmails = () => {
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const token = Cookies.get("auth_token");

  useEffect(() => {
    fetch(`${API_URL}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((data) =>
        setEmails(
          String(data.notifyEmails ?? "")
            .split(",")
            .map((e: string) => e.trim())
            .filter(Boolean)
        )
      )
      .catch(() =>
        setMessage({ ok: false, text: "Could not load the settings." })
      )
      .finally(() => setLoading(false));
  }, [token]);

  const save = async (next: string[]) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notifyEmails: next.join(", ") }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          Array.isArray(body.message)
            ? body.message.join(", ")
            : body.message || "Could not save"
        );
      }
      const data = await res.json();
      setEmails(
        String(data.notifyEmails ?? "")
          .split(",")
          .map((e: string) => e.trim())
          .filter(Boolean)
      );
      setMessage({ ok: true, text: "Saved." });
    } catch (error) {
      setMessage({
        ok: false,
        text: error instanceof Error ? error.message : "Could not save",
      });
    } finally {
      setSaving(false);
    }
  };

  const add = () => {
    const value = draft.trim();
    if (!isEmail(value)) {
      setMessage({ ok: false, text: "That doesn't look like an email address." });
      return;
    }
    if (emails.some((e) => e.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    setDraft("");
    save([...emails, value]);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-1">Notification emails</h2>
      <p className="text-gray-600 text-sm mb-5">
        These addresses get an email every time a family registers — website
        sign-up, Winter League or Indoor — and when a parent starts or confirms
        an e-transfer. Each email shows the player, parent, phone and the
        amount to expect, so you can match the money in the bank.
      </p>

      {loading ? (
        <Loader2 className="animate-spin text-gray-400" />
      ) : (
        <>
          <ul className="space-y-2 mb-4">
            {emails.length === 0 && (
              <li className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                Nobody is notified at the moment.
              </li>
            )}
            {emails.map((email) => (
              <li
                key={email}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <span className="break-all">{email}</span>
                <button
                  onClick={() => save(emails.filter((e) => e !== email))}
                  disabled={saving}
                  className="ml-3 text-gray-400 hover:text-red-600 disabled:opacity-50"
                  aria-label={`Remove ${email}`}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <input
              type="email"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="coach@example.com"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E43125]"
            />
            <button
              onClick={add}
              disabled={saving || !draft.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-[#E43125] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Add
            </button>
          </div>
        </>
      )}

      {message && (
        <p
          className={`mt-3 text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
};

export default NotificationEmails;
