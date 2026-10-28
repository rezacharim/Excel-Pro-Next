"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * /unsubscribe?e=<email>&t=<signature> — the link at the bottom of every
 * promotional email (CASL). One click, no login. The signature is checked on
 * the server, so a link only works for the address it was sent to.
 */

const API = process.env.NEXT_PUBLIC_API_URL;

const Unsubscribe = () => {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [state, setState] = useState<"ready" | "busy" | "done" | "error">("ready");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setEmail(q.get("e") ?? "");
    setToken(q.get("t") ?? "");
  }, []);

  const confirm = async () => {
    setState("busy");
    setError(null);
    try {
      const res = await fetch(`${API}/users/email-preferences/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Something went wrong.");
      setState("done");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  };

  const valid = !!email && !!token;

  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-xl px-4 pb-20 pt-44 sm:pt-52">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
          {state === "done" ? (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl">✓</div>
              <h1 className="text-2xl font-bold text-[#020022]">You are unsubscribed</h1>
              <p className="mt-3 text-gray-600">
                <strong>{email}</strong> will no longer receive news, offers or invitations from Excel Pro Soccer
                Academy. Emails about your own registration — receipts, payment reminders and session details — will
                still reach you.
              </p>
              <p className="mt-3 text-sm text-gray-500">
                Changed your mind? Tick the email box next time you register, or write to{" "}
                <a className="underline" href="mailto:excelprosocceracademy@gmail.com">
                  excelprosocceracademy@gmail.com
                </a>
                .
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[#020022]">Unsubscribe from promotional emails</h1>
              {valid ? (
                <p className="mt-3 text-gray-600">
                  Stop sending news, offers and invitations to <strong>{email}</strong>?
                </p>
              ) : (
                <p className="mt-3 text-gray-600">
                  This link is incomplete. Please use the unsubscribe link at the bottom of our email, or reply to it
                  with &ldquo;unsubscribe&rdquo;.
                </p>
              )}
              {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              {valid && (
                <button
                  onClick={confirm}
                  disabled={state === "busy"}
                  className="mt-6 rounded-lg bg-[#E43125] px-8 py-3 font-semibold text-white transition hover:bg-[#c4291f] disabled:opacity-60"
                >
                  {state === "busy" ? "Unsubscribing…" : "Unsubscribe"}
                </button>
              )}
            </>
          )}
          <p className="mt-6 text-sm">
            <Link href="/" className="text-[#E43125] underline">
              Back to excelproso.com
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Unsubscribe;
