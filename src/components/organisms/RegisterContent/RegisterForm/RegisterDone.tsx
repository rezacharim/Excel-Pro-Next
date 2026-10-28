"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Etransfer from "../../Etransfer/Etransfer";

/**
 * The screen after the /register form.
 *
 * It used to go straight to the e-transfer payment page, so a family that
 * already trains (and already paid) — asked only to put their child's details
 * on file — was shown a bill. Now registration is confirmed first, and the
 * payment page opens only for a family who says they are new.
 */
const RegisterDone = () => {
  const [info, setInfo] = useState<{ name: string; email: string; alreadyOnFile: boolean } | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("registerDone");
      if (raw) setInfo(JSON.parse(raw));
    } catch {
      /* fine */
    }
  }, []);

  if (paying) {
    return (
      <div className="my-12 flex flex-col items-center justify-center">
        <button onClick={() => setPaying(false)} className="mb-4 text-sm text-gray-500 underline">
          ← Back
        </button>
        <Etransfer />
      </div>
    );
  }

  const first = (info?.name || "").split(" ")[0];

  return (
    <div className="mx-auto my-12 max-w-xl px-4">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl">✓</div>
        <h1 className="text-2xl font-bold text-[#020022]">
          {info?.alreadyOnFile ? "Details updated" : "Registered"}
          {first ? ` — ${first} is on file` : ""}
        </h1>
        <p className="mt-3 text-gray-600">
          {info?.alreadyOnFile
            ? "We already had your child on file and have updated their details. Thank you!"
            : "Thank you — your child's information is now on file with the academy."}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-[#020022] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#E43125]">Already training with us?</p>
          <p className="mt-2 font-bold">You&apos;re all set — no payment needed.</p>
          <p className="mt-1 text-sm text-gray-300">
            Sign in to your account to see your child, your receipts and our new referral program — refer a friend and
            earn a free private session.
          </p>
          <Link
            href="/account"
            className="mt-4 inline-block rounded-lg bg-[#E43125] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c4291f]"
          >
            Go to my account
          </Link>
        </div>
        <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">New to Excel Pro?</p>
          <p className="mt-2 font-bold text-[#020022]">Pay your first membership by e-transfer.</p>
          <p className="mt-1 text-sm text-gray-600">Your spot is confirmed once payment is received.</p>
          <button
            onClick={() => setPaying(true)}
            className="mt-4 rounded-lg border border-[#E43125] px-5 py-2.5 text-sm font-semibold text-[#E43125] hover:bg-red-50"
          >
            Continue to payment
          </button>
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-gray-500">
        Not sure? Call{" "}
        <a href="tel:+16477037821" className="underline">
          +1 647-703-7821
        </a>{" "}
        and we&apos;ll tell you.
      </p>
    </div>
  );
};

export default RegisterDone;
