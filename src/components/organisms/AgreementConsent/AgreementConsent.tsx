"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACKNOWLEDGEMENTS,
  AGREEMENT_INTRO,
  AGREEMENT_SECTIONS,
  AGREEMENT_TITLE,
  AGREEMENT_VERSION,
} from "./agreementText";

// Brand colours. If these don't match the rest of the site, change them here
// only — nothing else in this file hardcodes a colour.
const NAVY = "#020022";
const RED = "#E43125";

export type AgreementValue = {
  agreementVersion: string;
  parentSignature: string;
  consentTerms: boolean;
  acceptedConcussion: boolean;
  consentPhoto: boolean | null;
  scrolledToEnd: boolean;
};

export const EMPTY_AGREEMENT: AgreementValue = {
  agreementVersion: AGREEMENT_VERSION,
  parentSignature: "",
  consentTerms: false,
  acceptedConcussion: false,
  consentPhoto: null,
  scrolledToEnd: false,
};

export function isAgreementComplete(v: AgreementValue) {
  return (
    v.consentTerms &&
    v.acceptedConcussion &&
    v.consentPhoto !== null &&
    v.parentSignature.trim().length >= 3
  );
}

type Props = {
  value: AgreementValue;
  onChange: (v: AgreementValue) => void;
  /** Set true after the parent form has been submitted once, to show errors. */
  showErrors?: boolean;
};

export default function AgreementConsent({
  value,
  onChange,
  showErrors = false,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  const set = useCallback(
    (patch: Partial<AgreementValue>) => onChange({ ...value, ...patch }),
    [value, onChange]
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max <= 0 ? 1 : Math.min(1, el.scrollTop / max);
    setProgress(pct);
    if (pct > 0.97 && !value.scrolledToEnd) set({ scrolledToEnd: true });
  }, [set, value.scrolledToEnd]);

  // If the box is short enough that there's nothing to scroll, count it as read.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 4 && !value.scrolledToEnd) {
      set({ scrolledToEnd: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const err = (bad: boolean) => showErrors && bad;

  return (
    <section className="w-full" aria-labelledby="agreement-title">
      <h2
        id="agreement-title"
        className="text-xl font-bold sm:text-2xl"
        style={{ color: NAVY }}
      >
        {AGREEMENT_TITLE}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Please read this in full. You&apos;ll confirm below before you can complete
        registration.
      </p>

      {/* Scroll progress */}
      <div
        className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-200"
        role="presentation"
      >
        <div
          className="h-full rounded-full transition-[width] duration-150"
          style={{ width: `${Math.round(progress * 100)}%`, background: RED }}
        />
      </div>

      {/* The agreement itself */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        tabIndex={0}
        role="region"
        aria-label="Agreement text"
        className="mt-2 h-72 overflow-y-auto rounded-lg border border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-96 sm:p-6"
        style={{ ["--tw-ring-color" as string]: NAVY }}
      >
        <p className="font-medium text-slate-900">{AGREEMENT_INTRO}</p>

        {AGREEMENT_SECTIONS.map((s) => (
          <div key={s.heading} className="mt-6 first:mt-4">
            <h3 className="font-semibold" style={{ color: NAVY }}>
              {s.heading}
            </h3>
            {s.paras?.map((p, i) => (
              <p key={i} className="mt-2">
                {p}
              </p>
            ))}
            {s.bullets && (
              <ul className="mt-2 space-y-1">
                {s.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden style={{ color: RED }}>
                      •
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {s.note && (
              <p
                className="mt-2 border-l-2 pl-3 text-slate-600"
                style={{ borderColor: RED }}
              >
                {s.note}
              </p>
            )}
          </div>
        ))}

        <p className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
          Excel Pro Soccer Academy · excelproso.com · 647-703-7821 · version{" "}
          {AGREEMENT_VERSION}
        </p>
      </div>

      {!value.scrolledToEnd && (
        <p className="mt-2 text-xs text-slate-500">
          Scroll to the end of the agreement to continue.
        </p>
      )}

      {/* What you are agreeing to — read, not clicked */}
      <div
        className="mt-6 rounded-lg border p-4"
        style={{ borderColor: NAVY, background: "#f7f7fb" }}
      >
        <h3 className="text-sm font-semibold" style={{ color: NAVY }}>
          In short, you are agreeing that
        </h3>
        <ul className="mt-2 space-y-2">
          {ACKNOWLEDGEMENTS.map((a) => (
            <li key={a} className="flex gap-2 text-sm leading-relaxed text-slate-700">
              <span aria-hidden style={{ color: RED }}>
                &bull;
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Confirmations — two ticks only */}
      <div className="mt-4 space-y-3">
        <Check
          id="ac-agreement"
          checked={value.consentTerms}
          onChange={(c) => set({ consentTerms: c })}
          invalid={err(!value.consentTerms)}
        >
          I have read and I accept the agreement above and everything listed in
          this summary. I have disclosed all relevant medical information for my
          child, and I authorise Excel Pro staff to obtain emergency medical
          treatment if I cannot be reached.
        </Check>

        <Check
          id="ac-concussion"
          checked={value.acceptedConcussion}
          onChange={(c) => set({ acceptedConcussion: c })}
          invalid={err(!value.acceptedConcussion)}
        >
          I confirm that within the last 12 months I have reviewed{" "}
          <a
            href="https://www.ontario.ca/page/rowans-law-concussion-safety"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
            style={{ color: NAVY }}
          >
            Ontario&apos;s Concussion Awareness Resources
          </a>{" "}
          and the Excel Pro Concussion Code of Conduct in section 9. Required
          every season by Rowan&apos;s Law.
        </Check>
      </div>

      {/* Photo consent — separate, optional either way */}
      <fieldset
        className={`mt-5 rounded-lg border p-4 ${
          err(value.consentPhoto === null)
            ? "border-red-500 bg-red-50"
            : "border-slate-300 bg-slate-50"
        }`}
      >
        <legend className="px-1 text-sm font-semibold" style={{ color: NAVY }}>
          Photos and video
        </legend>
        <p className="text-sm text-slate-600">
          We photograph and film training and matches for the website and
          Instagram. Either answer is fine and your child&apos;s registration is
          not affected. You can change your mind at any time.
        </p>
        <div className="mt-3 space-y-2">
          <Radio
            name="consentPhoto"
            checked={value.consentPhoto === true}
            onChange={() => set({ consentPhoto: true })}
          >
            Yes, Excel Pro may use photos and video of my child.
          </Radio>
          <Radio
            name="consentPhoto"
            checked={value.consentPhoto === false}
            onChange={() => set({ consentPhoto: false })}
          >
            No, please do not use photos or video of my child.
          </Radio>
        </div>
      </fieldset>

      {/* Typed signature */}
      <div className="mt-5">
        <label
          htmlFor="parentSignature"
          className="block text-sm font-semibold"
          style={{ color: NAVY }}
        >
          Type your full name to sign
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Typing your name has the same effect as a handwritten signature. You
          must be the parent or legal guardian of the player being registered.
        </p>
        <input
          id="parentSignature"
          name="parentSignature"
          type="text"
          autoComplete="name"
          value={value.parentSignature}
          onChange={(e) => set({ parentSignature: e.target.value })}
          placeholder="Full name of parent or guardian"
          aria-invalid={err(value.parentSignature.trim().length < 3)}
          className={`mt-2 w-full rounded-lg border px-3 py-2.5 text-base outline-none focus:ring-2 ${
            err(value.parentSignature.trim().length < 3)
              ? "border-red-500"
              : "border-slate-300"
          }`}
          style={{ ["--tw-ring-color" as string]: NAVY }}
        />
      </div>

      {showErrors && !isAgreementComplete(value) && (
        <p className="mt-3 text-sm font-medium text-red-600">
          Please tick both confirmations, choose a photo option, and type your
          name.
        </p>
      )}
    </section>
  );
}

function Check({
  id,
  checked,
  onChange,
  invalid,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (c: boolean) => void;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm leading-relaxed ${
        invalid ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-current"
        style={{ color: RED }}
      />
      <span className="text-slate-700">{children}</span>
    </label>
  );
}

function Radio({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer gap-3 text-sm text-slate-700">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ accentColor: RED }}
      />
      <span>{children}</span>
    </label>
  );
}
