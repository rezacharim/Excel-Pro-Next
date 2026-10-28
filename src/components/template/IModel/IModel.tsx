"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getImodelOffer,
  getLeagueSeason,
  registerForLeague,
  type ImodelOffer,
  type LeagueSeason,
  type PublicRegisterPayload,
} from "@/services/league";
import { IMODEL, SEASONS, TRIALS_PATH, whatsappHref } from "@/data/academy";
import AgreementConsent, {
  emptyAgreement,
  isAgreementComplete,
  type AgreementValue,
} from "@/components/organisms/AgreementConsent/AgreementConsent";

/**
 * /imodel — the I-Model Team, Summer 2027.
 *
 * The team is selective, so this page has two faces:
 *  - Without a link: what the team is, the price, and "book a trial".
 *  - With ?offer=… (the personal link from the offer email sent from
 *    Dashboard → Trials → Offer a spot): the registration form, already
 *    filled in with what the family gave at the trial.
 *
 * Prices come from the I-Model season (Dashboard → League → Season
 * settings): the on-time fee is the early bird price, the "late" fee is the
 * regular price, and the late-fee date is the last early bird day.
 */

const SLUG = "imodel";
const VENUE = SEASONS.indoor.venue;

const money = (n: number) => `$${Number(n || 0).toLocaleString("en-CA")}`;

const longDate = (iso: string | null) =>
  iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

const daysUntil = (iso: string | null) =>
  iso
    ? Math.ceil(
        (new Date(`${iso}T23:59:59`).getTime() - Date.now()) / 86_400_000
      )
    : null;

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

const Spinner = () => (
  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
);

/** The prices as the season states them right now. */
const pricesOf = (season: LeagueSeason | null) => {
  const regular = season ? Number(season.feeLate) : IMODEL.fee;
  const early = season ? Number(season.feeTotal) : IMODEL.earlyBird;
  const by = season ? season.lateFeeFrom : IMODEL.earlyBirdBy;
  const earlyOpen =
    early < regular && !!by && (season ? !season.isLateNow : (daysUntil(by) ?? -1) >= 0);
  return { regular, early, by, earlyOpen, saving: regular - early };
};

const IModel = () => {
  const [season, setSeason] = useState<LeagueSeason | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [offer, setOffer] = useState<ImodelOffer | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("offer");
    setToken(t);
    getLeagueSeason(SLUG)
      .then(setSeason)
      .catch(() => setSeason(null));
    if (!t) {
      setChecked(true);
      return;
    }
    getImodelOffer(t)
      .then(setOffer)
      .catch((e: Error) => setOfferError(e.message))
      .finally(() => setChecked(true));
  }, []);

  const p = pricesOf(season);
  const closed = !!season && !season.registrationOpen;
  const left = p.earlyOpen ? daysUntil(p.by) : null;
  const first = offer?.firstName || "your child";

  return (
    <section className="bg-gray-50">
      <div className="bg-[#020022] text-white">
        <div className="mx-auto max-w-5xl px-4 pt-44 pb-14 sm:px-6 sm:pt-52 sm:pb-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#E43125]">
            {IMODEL.name} · {IMODEL.agesText}
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            {offer
              ? `${offer.firstName} has been offered a spot`
              : season?.tagline ?? "I-Model Team · Summer 2027"}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-300">
            {offer ? (
              <>
                Congratulations! Our coaches would like {offer.firstName} to join
                the {IMODEL.name} for the {IMODEL.league}. Accept the spot by
                registering below.
              </>
            ) : (
              <>
                A selected squad of {IMODEL.agesText} players who prepare all
                winter at {VENUE.name} for the {IMODEL.league}. Players are
                chosen at a free trial.
              </>
            )}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {p.earlyOpen ? (
              <>
                <div className="rounded-xl bg-[#E43125] p-5">
                  <p className="text-xs uppercase tracking-wide text-white/80">
                    Early bird
                  </p>
                  <p className="mt-1 text-3xl font-bold">{money(p.early)}</p>
                  <p className="text-sm text-white/90">
                    paid in full by {longDate(p.by)} — save {money(p.saving)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Regular fee
                  </p>
                  <p className="mt-1 text-2xl font-bold">{money(p.regular)}</p>
                  <p className="text-sm text-gray-400">
                    from {longDate(nextDay(p.by))}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-[#E43125] p-5 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-white/80">
                  Season fee
                </p>
                <p className="mt-1 text-3xl font-bold">{money(p.regular)}</p>
                <p className="text-sm text-white/90">
                  paid in full before the season starts
                </p>
              </div>
            )}
            <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                How to join
              </p>
              <p className="mt-1 text-2xl font-bold">By invitation</p>
              <p className="text-sm text-gray-400">after a free trial</p>
            </div>
          </div>

          {typeof left === "number" && left >= 0 && (
            <p className="mt-6 inline-block rounded-lg bg-white/10 px-4 py-2 text-sm">
              ⏳ <strong>{left} day{left === 1 ? "" : "s"}</strong> left at the
              early bird price.
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {!checked ? (
          <p className="py-10 text-center text-gray-500">Loading…</p>
        ) : !token ? (
          <ByInvitation />
        ) : offerError || !offer ? (
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
            <h2 className="text-xl font-bold text-[#020022]">
              This link isn&apos;t working
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please open the link exactly as it is in your offer email, or
              message us and we will send you a new one.
            </p>
            <a
              href={whatsappHref("Hi Excel Pro, my I-Model registration link isn't working.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-lg bg-[#25D366] px-6 py-3 font-semibold text-white"
            >
              Message us on WhatsApp
            </a>
          </div>
        ) : offer.alreadyRegistered ? (
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>
            <h2 className="text-xl font-bold text-[#020022]">
              {offer.firstName} is already registered
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              The balance and payment details are in your account.
            </p>
            <Link
              href="/account"
              className="mt-5 inline-block rounded-lg bg-[#E43125] px-6 py-3 font-semibold text-white"
            >
              Go to my account
            </Link>
          </div>
        ) : closed ? (
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
            <h2 className="text-xl font-bold text-[#020022]">
              Registration is paused
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please call{" "}
              <a className="text-[#E43125] underline" href="tel:+16477037821">
                647-703-7821
              </a>{" "}
              and we will confirm {first}&apos;s spot directly.
            </p>
          </div>
        ) : season ? (
          <ImodelForm
            season={season}
            offer={offer}
            token={token}
            onDone={() => setRegistered(true)}
          />
        ) : (
          <p className="text-center text-sm text-gray-600">
            Registration could not load. Please call 647-703-7821.
          </p>
        )}

        {season?.paymentInstructions &&
          offer &&
          !offer.alreadyRegistered &&
          !registered && (
          <div className="mt-12 rounded-xl border-l-4 border-[#E43125] bg-red-50 p-6">
            <h3 className="font-bold text-[#020022]">How to pay</h3>
            <p className="mt-2 text-sm text-gray-700">
              The full fee is paid by Interac e-Transfer.{" "}
              {p.earlyOpen
                ? `Pay ${money(p.early)} by ${longDate(p.by)} to keep the early bird price; after that the fee is ${money(p.regular)}.`
                : `The fee is ${money(p.regular)}.`}{" "}
              The I-Model fee is separate from indoor training.
            </p>
            <p className="mt-2 text-sm text-gray-700">
              {season.paymentInstructions}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

const nextDay = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

/** The page for a visitor without an offer link. */
const ByInvitation = () => (
  <div className="grid gap-6 md:grid-cols-3">
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <p className="text-3xl font-bold text-[#E43125]">1</p>
      <h3 className="mt-1 font-bold text-[#020022]">Book a free trial</h3>
      <p className="mt-1 text-sm text-gray-600">
        Your child joins a regular {IMODEL.agesText} session at {VENUE.name}.
      </p>
    </div>
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <p className="text-3xl font-bold text-[#E43125]">2</p>
      <h3 className="mt-1 font-bold text-[#020022]">Our coaches decide</h3>
      <p className="mt-1 text-sm text-gray-600">
        After the trial we tell you whether there is a place on the squad.
      </p>
    </div>
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <p className="text-3xl font-bold text-[#E43125]">3</p>
      <h3 className="mt-1 font-bold text-[#020022]">Accept the spot</h3>
      <p className="mt-1 text-sm text-gray-600">
        Selected players get a personal registration link by email. Pay early
        to get the early bird price.
      </p>
    </div>
    <div className="text-center md:col-span-3">
      <Link
        href={`${TRIALS_PATH}?for=imodel`}
        className="inline-block rounded-lg bg-[#E43125] px-8 py-3 font-semibold text-white transition hover:bg-[#c4291f]"
      >
        Book a free I-Model trial
      </Link>
      <p className="mt-3 text-sm text-gray-500">
        Already offered a spot? Open the link in your offer email.
      </p>
    </div>
  </div>
);

/* ------------------------------------------------------------------ form */

const ImodelForm = ({
  season,
  offer,
  token,
  onDone,
}: {
  season: LeagueSeason;
  offer: ImodelOffer;
  token: string;
  onDone: () => void;
}) => {
  const groups = season.ageGroups.map((g) => g.ageGroup);
  const [form, setForm] = useState<PublicRegisterPayload>({
    slug: SLUG,
    offerToken: token,
    ageGroup: groups.includes(offer.ageGroup) ? offer.ageGroup : "",
    firstName: offer.firstName,
    lastName: offer.lastName,
    dateOfBirth: offer.dateOfBirth ?? "",
    gender: offer.gender === "F" ? "F" : "M",
    email: offer.email,
    phone: offer.phone,
    address1: "",
    city: offer.city ?? "",
    province: "ON",
    postalCode: "",
    parentName: offer.parentName,
    medicalNotes: "",
    consentTerms: false,
    consentPhoto: false,
  });
  const [agreement, setAgreement] = useState<AgreementValue>(() =>
    emptyAgreement("academy")
  );
  const [busy, setBusy] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    amount: number;
    due: string | null;
    waitlisted: boolean;
  } | null>(null);

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
    required.every((k) => String(form[k] ?? "").trim()) &&
    isAgreementComplete(agreement);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const reg = await registerForLeague({
        ...form,
        consentTerms: agreement.consentTerms,
        consentPhoto: agreement.consentPhoto ?? false,
        agreementVersion: agreement.agreementVersion,
        parentSignature: agreement.parentSignature.trim(),
        acceptedConcussion: agreement.acceptedConcussion,
        consentMarketing: !!agreement.consentMarketing,
      });
      setDone({
        amount: reg.installments?.[0]?.amount ?? reg.feeTotal,
        due: reg.installments?.[0]?.dueDate ?? null,
        waitlisted: reg.status === "waitlist",
      });
      onDone();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(
        `${(e as Error).message || "We could not submit the form."} If this keeps happening, call 647-703-7821 and we will register ${form.firstName} for you.`
      );
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
          Welcome to the {IMODEL.name}!
        </h2>
        <p className="mt-3 text-gray-600">
          {done.waitlisted ? (
            <>
              {form.ageGroup} is full right now, so {form.firstName} is first on
              the waiting list. <strong>Please do not send payment yet</strong>{" "}
              — we will call you.
            </>
          ) : (
            <>
              We have emailed <strong>{form.email}</strong> with the details.{" "}
              {form.firstName}&apos;s spot is confirmed once we receive{" "}
              <strong>{money(done.amount)}</strong>
              {done.due ? ` by ${longDate(done.due)}` : ""}.
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
      <h2 className="text-xl font-bold text-[#020022]">
        Accept {offer.firstName}&apos;s spot
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        We filled in what you gave us at the trial — please check it and add
        the rest. Everything marked * is required.
      </p>

      <div className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Age group" required>
            <select
              className={inputClass}
              value={form.ageGroup}
              onChange={(e) => set("ageGroup", e.target.value)}
            >
              <option value="">Choose…</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
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
              placeholder="L4S 1M5"
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

        <div className="rounded-lg bg-gray-50 p-4 sm:p-5">
          <AgreementConsent
            variant="academy"
            value={agreement}
            onChange={setAgreement}
            showErrors={triedSubmit}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {triedSubmit && !ready && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Please fill in every field marked * and complete the agreement
            above.
          </p>
        )}

        <button
          onClick={() => (ready ? submit() : setTriedSubmit(true))}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E43125] py-3.5 font-semibold text-white transition hover:bg-[#c4291f] disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {busy && <Spinner />}
          Accept the spot
        </button>
      </div>
    </div>
  );
};

export default IModel;
