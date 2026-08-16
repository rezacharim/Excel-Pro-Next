"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getLeagueSeason,
  registerForLeague,
  type FeeLine,
  type LeagueSeason,
  type PublicRegisterPayload,
} from "@/services/league";

const SLUG = "indoor";

const money = (n: number) => `$${Number(n || 0).toFixed(0)}`;

const longDate = (iso: string | null) => {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const daysUntil = (iso: string | null) => {
  if (!iso) return null;
  return Math.ceil(
    (new Date(`${iso}T23:59:59`).getTime() - Date.now()) / 86_400_000
  );
};

const TONE: Record<string, string> = {
  ok: "text-green-700",
  medium: "text-amber-600",
  low: "text-[#E43125]",
  full: "text-gray-500",
};

const Spinner = () => (
  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
);

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] outline-none transition focus:border-[#E43125] focus:ring-1 focus:ring-[#E43125]";

const Field = ({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-[#E43125]">*</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
  </label>
);

const PriceCard = ({
  title,
  total,
  lines,
}: {
  title: string;
  total: number;
  lines: FeeLine[];
}) => (
  <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
    <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
    <p className="mt-1 text-2xl font-bold">{money(total)}</p>
    <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm text-gray-400">
      {lines.map((line) => (
        <li key={line.label} className="flex justify-between gap-3">
          <span>{line.label}</span>
          <span className="whitespace-nowrap">{money(line.amount)}</span>
        </li>
      ))}
    </ul>
  </div>
);

const Indoor = () => {
  const [season, setSeason] = useState<LeagueSeason | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    getLeagueSeason(SLUG)
      .then(setSeason)
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const daysLeft = daysUntil(season?.firstPaymentDue ?? null);

  return (
    <section className="bg-gray-50">
      <div className="bg-[#020022] text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#E43125]">
            Indoor Season
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            {season?.tagline ?? season?.name ?? "Indoor Season"}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-300">
            Reserve your child&apos;s spot for the indoor season
            {season?.startsOn ? `, starting ${longDate(season.startsOn)}` : ""}.
            Spaces are limited in each age group, and a spot is confirmed once
            the form and payment are complete.
          </p>

          {season && (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {/* Itemised, because a single large figure with no explanation
                  is answered with a message asking what it is. */}
              <PriceCard
                title="Already training with us"
                total={season.memberFee}
                lines={season.memberLines}
              />
              <PriceCard
                title="New to the academy"
                total={season.newPlayerFee}
                lines={season.newPlayerLines}
              />
              <div className="rounded-xl bg-[#E43125] p-5">
                <p className="text-xs uppercase tracking-wide text-white/80">
                  Deadline
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {longDate(season.firstPaymentDue) || "—"}
                </p>
                <p className="text-sm text-white/80">form and payment</p>
              </div>
            </div>
          )}

          {typeof daysLeft === "number" && daysLeft >= 0 && (
            <p className="mt-6 inline-block rounded-lg bg-white/10 px-4 py-2 text-sm">
              ⏳ <strong>{daysLeft} day{daysLeft === 1 ? "" : "s"}</strong> left
              to reserve a spot.
              {season!.recentSignups > 0 && (
                <span className="ml-1 text-gray-300">
                  {season!.recentSignups} famil
                  {season!.recentSignups === 1 ? "y" : "ies"} booked this week.
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {loadError && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p className="font-semibold">
              Indoor registration is not open right now.
            </p>
            <p className="mt-1">
              Please call{" "}
              <a className="underline" href="tel:+16477037821">
                +1 647-703-7821
              </a>{" "}
              or email{" "}
              <a
                className="underline"
                href="mailto:excelprosocceracademy@gmail.com"
              >
                excelprosocceracademy@gmail.com
              </a>{" "}
              and we will reserve your child&apos;s spot directly.
            </p>
          </div>
        )}

        {/* The single most-asked question: why am I paying for March now? */}
        {season?.paymentCoversNote && (
          <div className="mb-10 rounded-xl border-l-4 border-[#E43125] bg-white p-6 shadow-sm">
            <h2 className="font-bold text-[#020022]">
              What this payment covers
            </h2>
            <p className="mt-2 text-gray-700">{season.paymentCoversNote}</p>
          </div>
        )}

        {season && season.ageGroups.some((g) => g.show) && (
          <div className="mb-12">
            <h2 className="mb-4 text-xl font-bold text-[#020022]">
              Age groups
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {season.ageGroups.map((g) => (
                <div
                  key={g.ageGroup}
                  className={`rounded-xl border border-gray-200 bg-white p-4 text-center ${
                    g.tone === "full" ? "opacity-60" : ""
                  }`}
                >
                  <p className="text-lg font-bold text-[#020022]">
                    {g.ageGroup}
                  </p>
                  {g.show && (
                    <p className={`mt-1 text-sm font-semibold ${TONE[g.tone]}`}>
                      {g.label}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {season && !started && (
          <div className="rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-gray-200">
            <h2 className="text-xl font-bold text-[#020022]">
              Reserve a spot
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
              Takes about three minutes. You will get a confirmation email with
              the payment instructions, and a family account you can use from
              then on.
            </p>
            <button
              onClick={() => setStarted(true)}
              className="mt-5 rounded-lg bg-[#E43125] px-8 py-3 font-semibold text-white transition hover:bg-[#c4291f]"
            >
              Start registration
            </button>
            <p className="mt-4 text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/account" className="text-[#E43125] underline">
                Sign in to your dashboard
              </Link>
            </p>
          </div>
        )}

        {season && started && (
          <IndoorForm season={season} onBack={() => setStarted(false)} />
        )}

        {season?.paymentInstructions && (
          <div className="mt-12 rounded-xl border-l-4 border-[#E43125] bg-red-50 p-6">
            <h3 className="font-bold text-[#020022]">How to pay</h3>
            <p className="mt-2 text-sm text-gray-700">
              {season.paymentInstructions}
            </p>
            {season.uniformFee ? (
              <p className="mt-3 text-sm text-gray-700">
                The uniform is paid with this registration and{" "}
                <strong>collected at the first practice</strong>.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ form */

const IndoorForm = ({
  season,
  onBack,
}: {
  season: LeagueSeason;
  onBack: () => void;
}) => {
  const [form, setForm] = useState<PublicRegisterPayload>({
    slug: SLUG,
    ageGroup: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "M",
    email: "",
    phone: "",
    address1: "",
    city: "",
    province: "ON",
    postalCode: "",
    parentName: "",
    medicalNotes: "",
    consentTerms: false,
    consentPhoto: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ amount: number; waitlisted: boolean } | null>(
    null
  );

  const set = (k: keyof PublicRegisterPayload, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const required: (keyof PublicRegisterPayload)[] = [
    "ageGroup",
    "firstName",
    "lastName",
    "dateOfBirth",
    "email",
    "phone",
    "address1",
    "city",
    "postalCode",
  ];
  const ready =
    required.every((k) => String(form[k] ?? "").trim()) && form.consentTerms;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const reg = await registerForLeague(form);
      setDone({
        amount: reg.installments?.[0]?.amount ?? reg.feeTotal,
        waitlisted: reg.status === "waitlist",
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-[#020022]">
          {done.waitlisted ? "You are on the waiting list" : "Registration received"}
        </h2>
        <p className="mt-3 text-gray-600">
          {done.waitlisted ? (
            <>
              That age group is currently full, so {form.firstName} is on the
              waiting list. <strong>Please do not send payment yet</strong> — we
              will contact you as soon as a spot opens.
            </>
          ) : (
            <>
              We have emailed <strong>{form.email}</strong> with the payment
              details. {form.firstName}&apos;s spot is confirmed once we receive{" "}
              <strong>{money(done.amount)}</strong>.
            </>
          )}
        </p>
        {!done.waitlisted && season.paymentInstructions && (
          <div className="mt-6 rounded-lg border-l-4 border-[#E43125] bg-red-50 p-4 text-left text-sm text-gray-700">
            {season.paymentInstructions}
          </div>
        )}
        <Link
          href="/account"
          className="mt-6 inline-block rounded-lg bg-[#E43125] px-6 py-3 font-semibold text-white"
        >
          Go to my account
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-200">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back
      </button>
      <h2 className="text-xl font-bold text-[#020022]">Reserve your spot</h2>
      <p className="mt-1 text-sm text-gray-600">
        Everything marked * is required. If your child already trains with us we
        will recognise them from the email address and charge the member rate.
      </p>

      <div className="mt-6 space-y-5">
        <Field label="Age group" required>
          <select
            className={inputClass}
            value={form.ageGroup}
            onChange={(e) => set("ageGroup", e.target.value)}
          >
            <option value="">Choose an age group…</option>
            {season.ageGroups.map((g) => (
              <option key={g.ageGroup} value={g.ageGroup}>
                {g.ageGroup}
                {g.show && g.label ? ` — ${g.label}` : ""}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Player first name" required>
            <input
              className={inputClass}
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </Field>
          <Field label="Player last name" required>
            <input
              className={inputClass}
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </Field>
          <Field label="Date of birth" required>
            <input
              type="date"
              className={inputClass}
              value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </Field>
          <Field label="Gender" required>
            <select
              className={inputClass}
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Parent / guardian name">
            <input
              className={inputClass}
              value={form.parentName}
              onChange={(e) => set("parentName", e.target.value)}
            />
          </Field>
          <Field label="Phone number" required>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="647-555-1234"
            />
          </Field>
          <Field
            label="Email address"
            required
            hint="This is how you sign in and how we send the receipt."
          >
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Postal code" required>
            <input
              className={inputClass}
              value={form.postalCode}
              onChange={(e) => set("postalCode", e.target.value)}
              placeholder="L3T 3S2"
            />
          </Field>
          <Field label="Street address" required>
            <input
              className={inputClass}
              value={form.address1}
              onChange={(e) => set("address1", e.target.value)}
            />
          </Field>
          <Field label="City" required>
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Medical notes"
          hint="Allergies, asthma, medication — anything a coach must know."
        >
          <textarea
            rows={2}
            className={inputClass}
            value={form.medicalNotes}
            onChange={(e) => set("medicalNotes", e.target.value)}
          />
        </Field>

        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#E43125]"
              checked={form.consentTerms}
              onChange={(e) => set("consentTerms", e.target.checked)}
            />
            <span>
              I understand the spot is confirmed only once payment is received,
              and I accept the academy terms.{" "}
              <span className="text-[#E43125]">*</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#E43125]"
              checked={form.consentPhoto}
              onChange={(e) => set("consentPhoto", e.target.checked)}
            />
            <span>
              I consent to photos and video of my child being used by the
              academy.
            </span>
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={busy || !ready}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E43125] py-3.5 font-semibold text-white transition hover:bg-[#c4291f] disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {busy && <Spinner />}
          Reserve the spot
        </button>
      </div>
    </div>
  );
};

export default Indoor;
