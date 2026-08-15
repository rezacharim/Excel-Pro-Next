"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getLeagueSeason,
  getPortalLeague,
  portalRegisterForLeague,
  registerForLeague,
  type LeagueSeason,
  type PortalLeagueOverview,
  type PortalLeaguePlayer,
  type PublicRegisterPayload,
} from "@/services/league";
import { portalLogin } from "@/services/portal";
import { sendEmailOtp } from "@/services/sendOtpCode";

const TOKEN_KEY = "portal_token";
const EMAIL_KEY = "portal_email";

const money = (n: number) => `$${Number(n || 0).toFixed(0)}`;

const longDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const shortDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
};

const daysUntil = (iso: string | null) => {
  if (!iso) return null;
  const due = new Date(`${iso}T23:59:59`).getTime();
  return Math.ceil((due - Date.now()) / 86_400_000);
};

/* ------------------------------------------------------------------ bits */

const Spinner = () => (
  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
);

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string }> = {
    pending_payment: {
      label: "Awaiting payment",
      className: "bg-amber-100 text-amber-800",
    },
    confirmed: { label: "Spot confirmed", className: "bg-green-100 text-green-800" },
    submitted: { label: "On the roster", className: "bg-green-100 text-green-800" },
    waitlist: { label: "Waiting list", className: "bg-gray-200 text-gray-700" },
    withdrawn: { label: "Withdrawn", className: "bg-gray-200 text-gray-500" },
  };
  const s = map[status] ?? map.pending_payment;
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${s.className}`}
    >
      {s.label}
    </span>
  );
};

const Field = ({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-[#E43125]">*</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
  </label>
);

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] outline-none transition focus:border-[#E43125] focus:ring-1 focus:ring-[#E43125]";

/* ------------------------------------------------------------------ page */

const League = () => {
  const [season, setSeason] = useState<LeagueSeason | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [overview, setOverview] = useState<PortalLeagueOverview | null>(null);
  const [mode, setMode] = useState<"choose" | "existing" | "new">("choose");

  useEffect(() => {
    getLeagueSeason()
      .then(setSeason)
      .catch((e: Error) => setLoadError(e.message));
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) setToken(stored);
  }, []);

  const loadOverview = useCallback(async (t: string) => {
    try {
      setOverview(await getPortalLeague(t));
    } catch {
      // An expired session should send the parent back to the email step,
      // not show them a broken page.
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setOverview(null);
    }
  }, []);

  useEffect(() => {
    if (token) loadOverview(token);
  }, [token, loadOverview]);

  const daysLeft = daysUntil(season?.firstPaymentDue ?? null);

  return (
    <section className="bg-gray-50">
      {/* ---------------------------------------------------------- hero */}
      <div className="bg-[#020022] text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#E43125]">
            Ontario PISL &amp; YRSL
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            {season?.name ?? "Winter League"} Registration
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-300">
            Open for U9 to U16. Season starts{" "}
            {season?.startsOn ? longDate(season.startsOn) : "mid-October"}.
            Roster spots are limited and confirmed once the first payment is
            received.
          </p>

          {season && (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  1st payment
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {money(season.feeTotal / 2)}
                </p>
                <p className="text-sm text-gray-400">
                  due {longDate(season.firstPaymentDue)}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  2nd payment
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {money(season.feeTotal / 2)}
                </p>
                <p className="text-sm text-gray-400">
                  due {longDate(season.secondPaymentDue)}
                </p>
              </div>
              <div className="rounded-xl bg-[#E43125] p-5">
                <p className="text-xs uppercase tracking-wide text-white/80">
                  Total league fee
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {money(season.feeTotal)}
                </p>
                <p className="text-sm text-white/80">
                  {money(season.feeLate)} after {shortDate(season.firstPaymentDue)}
                </p>
              </div>
            </div>
          )}

          {typeof daysLeft === "number" && daysLeft >= 0 && (
            <p className="mt-6 inline-block rounded-lg bg-white/10 px-4 py-2 text-sm">
              ⏳ <strong>{daysLeft} day{daysLeft === 1 ? "" : "s"}</strong> left
              to register at {money(season!.feeTotal)} — after that the fee is{" "}
              {money(season!.feeLate)}.
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {loadError && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p className="font-semibold">
              Registration is not available right now.
            </p>
            <p className="mt-1">
              Please call us on{" "}
              <a className="underline" href="tel:+16477037821">
                +1 647-703-7821
              </a>{" "}
              or email{" "}
              <a className="underline" href="mailto:excelprosocceracademy@gmail.com">
                excelprosocceracademy@gmail.com
              </a>{" "}
              and we will register your child directly.
            </p>
          </div>
        )}

        {/* ------------------------------------------------ spots per group */}
        {season && (
          <div className="mb-12">
            <h2 className="mb-4 text-xl font-bold text-[#020022]">
              Spots remaining
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {season.ageGroups.map((g) => {
                const full = g.spotsLeft === 0;
                const low = !full && g.spotsLeft <= 4;
                return (
                  <div
                    key={g.ageGroup}
                    className={`rounded-xl border bg-white p-4 text-center ${
                      full ? "border-gray-200 opacity-60" : "border-gray-200"
                    }`}
                  >
                    <p className="text-lg font-bold text-[#020022]">
                      {g.ageGroup}
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold ${
                        full
                          ? "text-gray-500"
                          : low
                            ? "text-[#E43125]"
                            : "text-green-700"
                      }`}
                    >
                      {full
                        ? "Full — waiting list"
                        : `${g.spotsLeft} spot${g.spotsLeft === 1 ? "" : "s"} left`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- routing */}
        {overview ? (
          <ExistingFamily
            overview={overview}
            token={token!}
            onDone={() => loadOverview(token!)}
            onSignOut={() => {
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(EMAIL_KEY);
              setToken(null);
              setOverview(null);
              setMode("choose");
            }}
          />
        ) : mode === "choose" ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className="rounded-2xl border-2 border-[#E43125] bg-white p-7 text-left transition hover:shadow-lg"
            >
              <p className="text-lg font-bold text-[#020022]">
                We already train with Excel Pro
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Sign in with your email and register your child in about 30
                seconds. Everything we already hold is filled in for you.
              </p>
              <span className="mt-4 inline-block font-semibold text-[#E43125]">
                Continue →
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode("new")}
              className="rounded-2xl border border-gray-300 bg-white p-7 text-left transition hover:shadow-lg"
            >
              <p className="text-lg font-bold text-[#020022]">
                We are new to Excel Pro
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Fill in your child&apos;s details once. Takes about 3 minutes,
                and you get a family account you can use from then on.
              </p>
              <span className="mt-4 inline-block font-semibold text-[#020022]">
                Continue →
              </span>
            </button>
          </div>
        ) : mode === "existing" ? (
          <SignIn
            onBack={() => setMode("choose")}
            onSignedIn={(t, email) => {
              localStorage.setItem(TOKEN_KEY, t);
              localStorage.setItem(EMAIL_KEY, email);
              setToken(t);
            }}
          />
        ) : (
          <NewFamilyForm season={season} onBack={() => setMode("choose")} />
        )}

        {/* ----------------------------------------------------- payment */}
        {season?.paymentInstructions && (
          <div className="mt-12 rounded-xl border-l-4 border-[#E43125] bg-red-50 p-6">
            <h3 className="font-bold text-[#020022]">How to pay</h3>
            <p className="mt-2 text-sm text-gray-700">
              {season.paymentInstructions}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

/* -------------------------------------------------------------- sign in */

const SignIn = ({
  onBack,
  onSignedIn,
}: {
  onBack: () => void;
  onSignedIn: (token: string, email: string) => void;
}) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendEmailOtp(email.trim().toLowerCase());
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await portalLogin(email.trim().toLowerCase(), otp.trim());
      onSignedIn(res.token, res.email);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-200">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back
      </button>
      <h2 className="text-xl font-bold text-[#020022]">
        Sign in to register your child
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        {sent
          ? `We sent a 6-digit code to ${email}. It expires in 10 minutes.`
          : "Use the email address the academy has on file for your family."}
      </p>

      <div className="mt-5 space-y-4">
        <Field label="Email address" required>
          <input
            type="email"
            className={inputClass}
            value={email}
            disabled={sent}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        {sent && (
          <Field label="6-digit code" required>
            <input
              inputMode="numeric"
              maxLength={6}
              className={`${inputClass} tracking-[0.5em] text-center text-lg`}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
          </Field>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={busy || (!sent && !email) || (sent && otp.length !== 6)}
          onClick={sent ? verify : send}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E43125] py-3 font-semibold text-white transition hover:bg-[#c4291f] disabled:opacity-50"
        >
          {busy && <Spinner />}
          {sent ? "Verify and continue" : "Send me a code"}
        </button>

        {sent && (
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setOtp("");
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Use a different email
          </button>
        )}

        <p className="text-center text-xs text-gray-500">
          Not registered with us yet?{" "}
          <button onClick={onBack} className="text-[#E43125] underline">
            Use the new family form
          </button>
        </p>
      </div>
    </div>
  );
};

/* ------------------------------------------------------ existing family */

const ExistingFamily = ({
  overview,
  token,
  onDone,
  onSignOut,
}: {
  overview: PortalLeagueOverview;
  token: string;
  onDone: () => void;
  onSignOut: () => void;
}) => {
  const [openFor, setOpenFor] = useState<number | null>(null);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#020022]">Your players</h2>
        <div className="flex gap-4 text-sm">
          <Link href="/account" className="text-[#E43125] hover:underline">
            My dashboard
          </Link>
          <button onClick={onSignOut} className="text-gray-500 hover:underline">
            Sign out
          </button>
        </div>
      </div>

      {overview.players.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          We could not find any players under this email. If your child trains
          with us under a different address, sign out and try that one — or{" "}
          <Link href="/register" className="text-[#E43125] underline">
            register as a new player
          </Link>
          .
        </div>
      )}

      <div className="space-y-4">
        {overview.players.map((p) => (
          <PlayerRow
            key={p.userId}
            player={p}
            token={token}
            open={openFor === p.userId}
            onToggle={() =>
              setOpenFor(openFor === p.userId ? null : p.userId)
            }
            onDone={() => {
              setOpenFor(null);
              onDone();
            }}
          />
        ))}
      </div>

      <p className="mt-6 text-sm text-gray-600">
        Another child not shown here?{" "}
        <Link href="/register" className="text-[#E43125] underline">
          Add them to your family account
        </Link>
        .
      </p>
    </div>
  );
};

const AGE_GROUPS = ["U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16"];

const PlayerRow = ({
  player,
  token,
  open,
  onToggle,
  onDone,
}: {
  player: PortalLeaguePlayer;
  token: string;
  open: boolean;
  onToggle: () => void;
  onDone: () => void;
}) => {
  const reg = player.registration;
  const [ageGroup, setAgeGroup] = useState("");
  const [consent, setConsent] = useState(false);
  const [extra, setExtra] = useState({
    dateOfBirth: "",
    address1: "",
    city: "",
    postalCode: "",
    medicalNotes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needs = player.missingForLeague;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await portalRegisterForLeague(token, {
        userId: player.userId,
        ageGroup,
        consentTerms: consent,
        ...(needs.includes("dateOfBirth") && { dateOfBirth: extra.dateOfBirth }),
        ...(needs.includes("address") && { address1: extra.address1 }),
        ...(needs.includes("city") && { city: extra.city }),
        ...(needs.includes("postalCode") && { postalCode: extra.postalCode }),
        ...(extra.medicalNotes && { medicalNotes: extra.medicalNotes }),
      });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-[#020022]">{player.fullname}</p>
          {player.dateOfBirth && (
            <p className="text-sm text-gray-500">
              Born {longDate(player.dateOfBirth.slice(0, 10))}
            </p>
          )}
        </div>
        {reg ? (
          <StatusPill status={reg.status} />
        ) : (
          <button
            onClick={onToggle}
            className="rounded-lg bg-[#E43125] px-5 py-2.5 font-semibold text-white transition hover:bg-[#c4291f]"
          >
            {open ? "Cancel" : "Register for the league"}
          </button>
        )}
      </div>

      {reg && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <span className="text-gray-600">
              Age group: <strong className="text-[#020022]">{reg.ageGroup}</strong>
            </span>
            <span className="text-gray-600">
              Paid:{" "}
              <strong className="text-green-700">{money(reg.amountPaid)}</strong>{" "}
              of {money(reg.feeTotal)}
            </span>
            {reg.balance > 0 && (
              <span className="text-gray-600">
                Balance:{" "}
                <strong className="text-[#E43125]">{money(reg.balance)}</strong>
              </span>
            )}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {reg.installments
              .filter((i) => i.amount > 0)
              .map((i) => (
                <div
                  key={i.number}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5 text-sm"
                >
                  <span className="text-gray-700">
                    {i.number === 1 ? "1st" : "2nd"} payment · {money(i.amount)}
                  </span>
                  <span
                    className={
                      i.paidAt
                        ? "font-semibold text-green-700"
                        : "text-gray-500"
                    }
                  >
                    {i.paidAt ? "Received ✓" : `due ${shortDate(i.dueDate)}`}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {open && !reg && (
        <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
          <Field label="Age group" required>
            <select
              className={inputClass}
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
            >
              <option value="">Choose an age group…</option>
              {AGE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>

          {needs.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="mb-3 text-sm text-amber-900">
                The league needs a few details we do not have on file yet.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {needs.includes("dateOfBirth") && (
                  <Field label="Date of birth" required>
                    <input
                      type="date"
                      className={inputClass}
                      value={extra.dateOfBirth}
                      onChange={(e) =>
                        setExtra({ ...extra, dateOfBirth: e.target.value })
                      }
                    />
                  </Field>
                )}
                {needs.includes("address") && (
                  <Field label="Street address" required>
                    <input
                      className={inputClass}
                      value={extra.address1}
                      onChange={(e) =>
                        setExtra({ ...extra, address1: e.target.value })
                      }
                    />
                  </Field>
                )}
                {needs.includes("city") && (
                  <Field label="City" required>
                    <input
                      className={inputClass}
                      value={extra.city}
                      onChange={(e) =>
                        setExtra({ ...extra, city: e.target.value })
                      }
                    />
                  </Field>
                )}
                {needs.includes("postalCode") && (
                  <Field label="Postal code" required>
                    <input
                      className={inputClass}
                      value={extra.postalCode}
                      onChange={(e) =>
                        setExtra({ ...extra, postalCode: e.target.value })
                      }
                    />
                  </Field>
                )}
              </div>
            </div>
          )}

          <Field
            label="Medical notes"
            hint="Allergies, asthma, medication — anything a coach must know."
          >
            <textarea
              rows={2}
              className={inputClass}
              value={extra.medicalNotes}
              onChange={(e) =>
                setExtra({ ...extra, medicalNotes: e.target.value })
              }
            />
          </Field>

          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#E43125]"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I accept the league terms and understand that the roster spot is
              confirmed only once the first payment is received.
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={busy || !ageGroup || !consent}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#E43125] px-6 py-3 font-semibold text-white transition hover:bg-[#c4291f] disabled:opacity-50"
          >
            {busy && <Spinner />}
            Complete registration
          </button>
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------- new family */

const NewFamilyForm = ({
  season,
  onBack,
}: {
  season: LeagueSeason | null;
  onBack: () => void;
}) => {
  const [form, setForm] = useState<PublicRegisterPayload>({
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
    previousClub: "",
    consentTerms: false,
    consentPhoto: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ waitlisted: boolean } | null>(null);

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
  const ready = required.every((k) => String(form[k] ?? "").trim()) && form.consentTerms;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const reg = await registerForLeague(form);
      setDone({ waitlisted: reg.status === "waitlist" });
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
              That age group is currently full, so we have added{" "}
              {form.firstName} to the waiting list. <strong>Please do not
              send payment yet</strong> — we will contact you as soon as a spot
              opens.
            </>
          ) : (
            <>
              We have emailed <strong>{form.email}</strong> with the payment
              details. {form.firstName}&apos;s spot is confirmed once the first
              payment of {money((season?.feeTotal ?? 900) / 2)} is received.
            </>
          )}
        </p>
        {!done.waitlisted && season?.paymentInstructions && (
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
      <h2 className="text-xl font-bold text-[#020022]">Register your player</h2>
      <p className="mt-1 text-sm text-gray-600">
        Everything marked * is required by the league.
      </p>

      <div className="mt-6 space-y-5">
        <Field label="Age group" required>
          <select
            className={inputClass}
            value={form.ageGroup}
            onChange={(e) => set("ageGroup", e.target.value)}
          >
            <option value="">Choose an age group…</option>
            {(season?.ageGroups ?? []).map((g) => (
              <option key={g.ageGroup} value={g.ageGroup}>
                {g.ageGroup}
                {g.spotsLeft === 0
                  ? " — full, waiting list"
                  : ` — ${g.spotsLeft} left`}
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
          <Field
            label="Date of birth"
            required
            hint="Must match the child's passport or birth certificate."
          >
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
            hint="This is how you sign in and how we send receipts."
          >
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Previous club">
            <input
              className={inputClass}
              value={form.previousClub}
              onChange={(e) => set("previousClub", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
          <Field label="Postal code" required>
            <input
              className={inputClass}
              value={form.postalCode}
              onChange={(e) => set("postalCode", e.target.value)}
              placeholder="L3T 3S2"
            />
          </Field>
          <Field label="Province">
            <input
              className={inputClass}
              value={form.province}
              onChange={(e) => set("province", e.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Medical notes"
          hint="Allergies, asthma, medication — anything a coach must know on the field."
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
              I accept the league terms and understand that the roster spot is
              confirmed only once the first payment is received.{" "}
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
          Complete registration
        </button>
      </div>
    </div>
  );
};

export default League;
