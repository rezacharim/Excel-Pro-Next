"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { bookTrial, type BookTrialPayload } from "@/services/league";
import {
  ACADEMY_GROUPS,
  AGE_RANGE,
  FREE_SESSION,
  IMODEL,
  SEASONS,
  groupByKey,
  trialSessionsFor,
  whatsappHref,
} from "@/data/academy";

/**
 * /trials — one page for both ways in:
 *
 *   I-Model Team trial  U13–U16, selective, trialists join a regular indoor
 *                       session of their group and coaches pick the squad.
 *   Free first session  any age 6–18, one regular session on the academy.
 *
 * Bookings go to POST /league/trials and land in Dashboard → Trials, where
 * Reza picks a date and sends the invitation. The kind of trial and the
 * session the family prefers travel in `preferredWhen` ("I-Model trial · Mon
 * 5–6 pm"), which the dashboard reads back — no database change needed.
 *
 * Links can preselect: ?for=imodel or ?for=free, and record where the family
 * came from: ?src=instagram, ?src=invite, ?src=comeback.
 */

type Kind = "imodel" | "free";

const VENUE = SEASONS.indoor.venue;

const SOURCES: { value: string; label: string }[] = [
  { value: "Instagram", label: "Instagram" },
  { value: "Friend or family", label: "A friend or family member" },
  { value: "Google", label: "Google" },
  { value: "Invitation email", label: "An email from Excel Pro" },
  { value: "Played with Excel Pro before", label: "My child played with Excel Pro before" },
  { value: "Other", label: "Other" },
];

const SRC_TO_SOURCE: Record<string, string> = {
  instagram: "Instagram",
  ig: "Instagram",
  invite: "Invitation email",
  comeback: "Played with Excel Pro before",
  google: "Google",
  friend: "Friend or family",
};

/** The message pre-typed when a parent taps "Message us on WhatsApp". */
const whatsappMessage = (kind: Kind) =>
  kind === "imodel"
    ? `Hi Excel Pro, I'd like to book an ${IMODEL.name} trial for my child.`
    : "Hi Excel Pro, I'd like to book a free session for my child.";

const WhatsAppIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
  </svg>
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

/** A row of choice buttons. Not a <label>: a label passes every click on to
 * its first button, which re-selected the first age group on each tap. */
const Choices = ({
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
  <div role="group" aria-label={label}>
    <span className="mb-1 block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-[#E43125]">*</span>}
    </span>
    <div className="flex flex-wrap gap-2">{children}</div>
    {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
  </div>
);

/** "U13–U14: Mon 5–6 pm · Fri 5–6 pm", from the indoor timetable. */
const imodelSessionLines = (): string[] => {
  const byGroup = new Map<string, string[]>();
  for (const age of IMODEL.ages) {
    const key = IMODEL.trainsWith[age];
    if (!key) continue;
    byGroup.set(key, [...(byGroup.get(key) ?? []), age]);
  }
  return Array.from(byGroup.entries()).map(([key, ages]) => {
    const times = trialSessionsFor(key)
      .map((x) => `${x.short} ${x.time}`)
      .join(" · ");
    const span = ages.length > 1 ? `${ages[0]}–${ages[ages.length - 1]}` : ages[0];
    return `${span}: ${times}`;
  });
};

/** Indoor group key for whichever age group was picked. */
const groupKeyFor = (kind: Kind, ageGroup: string): string | null => {
  if (!ageGroup) return null;
  if (kind === "imodel") return IMODEL.trainsWith[ageGroup] ?? null;
  return groupByKey(ageGroup)?.key ?? null;
};

const Trials = () => {
  const [kind, setKind] = useState<Kind>(IMODEL.open ? "imodel" : "free");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "M" as "M" | "F",
    ageGroup: "",
    session: "",
    parentName: "",
    email: "",
    phone: "",
    city: "",
    previousClub: "",
    position: "",
    howHeard: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // Player id of the family who shared the link ("bring a friend").
  const [referrerId, setReferrerId] = useState<number | null>(null);

  // ?for= and ?src= from ads, emails and the rest of the site.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const wanted = q.get("for");
    if (wanted === "free" && FREE_SESSION.open) setKind("free");
    if (wanted === "imodel" && IMODEL.open) setKind("imodel");
    const src = SRC_TO_SOURCE[(q.get("src") ?? "").toLowerCase()];
    if (src) setForm((f) => ({ ...f, howHeard: src }));
    const ref = Number(q.get("ref"));
    if (Number.isInteger(ref) && ref > 0) {
      setReferrerId(ref);
      setForm((f) => ({ ...f, howHeard: f.howHeard || "Friend or family" }));
    }
    if (wanted) {
      document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const switchKind = (k: Kind) => {
    setKind(k);
    setForm((f) => ({ ...f, ageGroup: "", session: "" }));
  };

  const ageOptions =
    kind === "imodel"
      ? IMODEL.ages.map((a) => ({ value: a, label: a }))
      : ACADEMY_GROUPS.map((g) => ({ value: g.key, label: g.short }));

  const sessions = useMemo(() => {
    const key = groupKeyFor(kind, form.ageGroup);
    return key ? trialSessionsFor(key) : [];
  }, [kind, form.ageGroup]);

  const ready =
    !!form.firstName.trim() &&
    !!form.lastName.trim() &&
    !!form.ageGroup &&
    !!form.parentName.trim() &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.phone.replace(/\D/g, "").length >= 10;

  const submit = async () => {
    setBusy(true);
    setError(null);
    const label = kind === "imodel" ? "I-Model trial" : "Free session";
    const payload: BookTrialPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
      gender: form.gender,
      ageGroup: form.ageGroup,
      parentName: form.parentName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      ...(form.city.trim() ? { city: form.city.trim() } : {}),
      ...(form.previousClub.trim() ? { previousClub: form.previousClub.trim() } : {}),
      ...(form.position.trim() ? { position: form.position.trim() } : {}),
      preferredWhen: `${label} · ${form.session || "any session"}`,
      ...(form.howHeard ? { howHeard: form.howHeard } : {}),
      ...(referrerId ? { referrerId } : {}),
    };
    try {
      await bookTrial(payload);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(
        `${(e as Error).message || "We could not send the form."} You can also call +1 647-703-7821 and we will book it for you.`
      );
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <section className="bg-gray-50">
        <div className="mx-auto max-w-xl px-4 pb-20 pt-44 sm:pt-52">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-[#020022]">
              {kind === "imodel" ? "Trial request received" : "Free session booked"}
            </h1>
            <p className="mt-3 text-gray-600">
              Thank you. We will email <strong>{form.email}</strong> with the
              date and time for {form.firstName}&apos;s{" "}
              {kind === "imodel" ? `${IMODEL.name} trial` : "free session"}, at{" "}
              {VENUE.name}. There is nothing to pay.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Bring soccer cleats, shin guards and water.
            </p>
            <Link
              href="/program"
              className="mt-6 inline-block rounded-lg bg-[#E43125] px-6 py-3 font-semibold text-white"
            >
              See our programs
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const KindCard = ({
    value,
    badge,
    title,
    text,
  }: {
    value: Kind;
    badge: string;
    title: string;
    text: string;
  }) => (
    <button
      type="button"
      onClick={() => switchKind(value)}
      aria-pressed={kind === value}
      className={`rounded-xl p-5 text-left ring-1 transition ${
        kind === value
          ? "bg-[#E43125] text-white ring-[#E43125]"
          : "bg-white/5 text-white ring-white/15 hover:bg-white/10"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${
          kind === value ? "text-white/80" : "text-gray-400"
        }`}
      >
        {badge}
      </p>
      <p className="mt-1 text-xl font-bold">{title}</p>
      <p className={`mt-1 text-sm ${kind === value ? "text-white/90" : "text-gray-300"}`}>
        {text}
      </p>
    </button>
  );

  return (
    <section className="bg-gray-50">
      <div className="bg-[#020022] text-white">
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-44 sm:px-6 sm:pb-20 sm:pt-52">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#E43125]">
            Trials &amp; free sessions
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            Come and train with us — free
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-300">
            One session with our coaches at {VENUE.name}, at no cost. Choose
            what you are looking for:
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {IMODEL.open && (
              <KindCard
                value="imodel"
                badge={`Selective · ${IMODEL.agesText}`}
                title={`${IMODEL.name} trials`}
                text={`Try out for the squad we prepare all winter for the ${IMODEL.league}.`}
              />
            )}
            {FREE_SESSION.open && (
              <KindCard
                value="free"
                badge={`Any level · ages ${AGE_RANGE.text}`}
                title="Free first session"
                text="New to Excel Pro? Join one regular training session with your child's age group."
              />
            )}
          </div>
          <p className="mt-5 text-sm text-gray-300">
            Rather message?{" "}
            <a
              href={whatsappHref(whatsappMessage(kind))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#25D366] underline"
            >
              <WhatsAppIcon className="h-4 w-4" /> Chat with us on WhatsApp
            </a>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* What it is */}
        <div className="mb-10 grid gap-6 md:grid-cols-3">
          {kind === "imodel" ? (
            <>
              <Info title="The team">
                A selected squad of {IMODEL.agesText} players. They train through
                the winter at {VENUE.name} and compete together in the{" "}
                {IMODEL.league}.
              </Info>
              <Info title="The trial">
                Your child joins a regular session for their age group. Our
                coaches watch, and we tell you afterwards whether there is a
                place on the squad. The trial is free.
              </Info>
              <Info title="Trial sessions">
                {imodelSessionLines().map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                <a
                  href={VENUE.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#E43125] underline"
                >
                  {VENUE.name}
                </a>
              </Info>
            </>
          ) : (
            <>
              <Info title="Who it is for">
                Boys and girls aged {AGE_RANGE.text}, any level — first-timers
                and experienced players alike.
              </Info>
              <Info title="What happens">
                Your child trains with their age group for one full session,
                and the coach tells you how it went. No commitment, nothing to
                pay.
              </Info>
              <Info title="Session times">
                {ACADEMY_GROUPS.map((g) => (
                  <span key={g.key} className="block">
                    {g.short}:{" "}
                    {(SEASONS.indoor.sessions[g.key] ?? [])
                      .map((x) => `${x.short} ${x.time}`)
                      .join(" · ")}
                  </span>
                ))}
              </Info>
            </>
          )}
        </div>

        {/* The form */}
        <div
          id="book"
          className="scroll-mt-48 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-200"
        >
          <h2 className="text-xl font-bold text-[#020022]">
            {kind === "imodel"
              ? `Book an ${IMODEL.name} trial`
              : "Book a free session"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Takes a minute. We email you the date and time to come.
          </p>
          {referrerId && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-gray-800">
              A family who trains with us invited you — welcome! Your first
              session is free.
            </p>
          )}
          <a
            href={whatsappHref(whatsappMessage(kind))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1ebe5a]"
          >
            <WhatsAppIcon />
            Rather message? Book on WhatsApp
          </a>

          <div className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Player first name" required>
                <input className={inputClass} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
              </Field>
              <Field label="Player last name" required>
                <input className={inputClass} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
              </Field>
              <Field label="Date of birth">
                <input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </Field>
              <Field label="Gender">
                <select className={inputClass} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </Field>
            </div>

            <Choices label="Age group" required>
                {ageOptions.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, ageGroup: o.value, session: "" }))}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      form.ageGroup === o.value
                        ? "border-[#E43125] bg-red-50 font-semibold text-[#E43125]"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
            </Choices>

            {sessions.length > 0 && (
              <Choices label="Which session suits you?" hint="We confirm the exact date by email.">
                  {[...sessions.map((x) => `${x.day} ${x.time}`), "Either is fine"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => set("session", label === "Either is fine" ? "" : label)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        (form.session || "Either is fine") === label
                          ? "border-[#E43125] bg-red-50 font-semibold text-[#E43125]"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
              </Choices>
            )}

            {kind === "imodel" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Current or last club">
                  <input className={inputClass} value={form.previousClub} onChange={(e) => set("previousClub", e.target.value)} placeholder="e.g. North York Hearts" />
                </Field>
                <Field label="Position">
                  <input className={inputClass} value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="e.g. Midfielder, Goalkeeper" />
                </Field>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Parent / guardian name" required>
                <input className={inputClass} value={form.parentName} onChange={(e) => set("parentName", e.target.value)} />
              </Field>
              <Field label="Phone number" required>
                <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="647-555-1234" />
              </Field>
              <Field label="Email address" required hint="The invitation with the date and time comes here.">
                <input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="City">
                <input className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Richmond Hill" />
              </Field>
            </div>

            <Field label="How did you hear about us?">
              <select className={inputClass} value={form.howHeard} onChange={(e) => set("howHeard", e.target.value)}>
                <option value="">Choose…</option>
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              onClick={submit}
              disabled={busy || !ready}
              className="w-full rounded-lg bg-[#E43125] py-3.5 font-semibold text-white transition hover:bg-[#c4291f] disabled:opacity-50 sm:w-auto sm:px-10"
            >
              {busy ? "Sending…" : kind === "imodel" ? "Request a trial" : "Book my free session"}
            </button>
            <p className="text-xs text-gray-500">
              Bring soccer cleats, shin guards and water. Questions? Call{" "}
              <a href="tel:+16477037821" className="underline">
                +1 647-703-7821
              </a>{" "}
              or{" "}
              <a
                href={whatsappHref(whatsappMessage(kind))}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                message us on WhatsApp
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const Info = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
    <h3 className="font-bold text-[#020022]">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-gray-600">{children}</p>
  </div>
);

export default Trials;
