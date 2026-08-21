"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

export interface RecordPaymentTarget {
  registrationId: number;
  player: string;
  installment: number;
  /** What the installment is supposed to be. Prefilled, but editable. */
  expected: number;
}

export interface RecordPaymentPayload {
  installment: number;
  amount: number;
  method: string;
  reference?: string;
  paidAt?: string;
  note?: string;
}

const METHODS = [
  { value: "etransfer", label: "e-Transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "stripe", label: "Card / Stripe" },
  { value: "other", label: "Other" },
];

const todayLocal = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Recording money against a league installment.
 *
 * This replaced a single "Mark $450 received" button that posted the expected
 * amount and nothing else. Real payments do not behave: a family sends $455
 * because they added the uniform fee, or pays cash, or paid a week ago, or the
 * e-transfer needs to be findable in the bank statement later. None of that
 * could be recorded, so the ledger and the bank drifted apart with no way to
 * reconcile them.
 *
 * The amount is prefilled with what is owed — the common case stays two
 * clicks — but every field can be corrected before saving.
 */
const RecordPaymentDialog = ({
  target,
  onCancel,
  onSubmit,
}: {
  target: RecordPaymentTarget | null;
  onCancel: () => void;
  onSubmit: (payload: RecordPaymentPayload) => Promise<void>;
}) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("etransfer");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(todayLocal());
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset every time a different row is opened, or the previous row's amount
  // would be sitting in the box.
  useEffect(() => {
    if (!target) return;
    setAmount(String(target.expected));
    setMethod("etransfer");
    setReference("");
    setPaidAt(todayLocal());
    setNote("");
    setError(null);
  }, [target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  if (!target) return null;

  const parsed = Number(amount);
  const isValid = !isNaN(parsed) && parsed > 0;
  const difference = isValid ? parsed - target.expected : 0;

  const save = async () => {
    if (!isValid) {
      setError("Enter the amount that actually arrived.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        installment: target.installment,
        amount: parsed,
        method,
        reference: reference.trim() || undefined,
        // Midday rather than midnight: a bare date is read as UTC, which in
        // Toronto lands on the evening before and shows the wrong day.
        paidAt: `${paidAt}T12:00:00`,
        note: note.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record the payment");
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
  };

  const field =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E43125]/30 focus:border-[#E43125]";
  const label = "block text-xs font-semibold text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Record payment {target.installment}
            </h2>
            <p className="mt-0.5 text-sm text-gray-600">{target.player}</p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className={label} htmlFor="pay-amount">
              Amount received
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                $
              </span>
              <input
                id="pay-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${field} pl-7`}
              />
            </div>
            {/* An over- or under-payment is normal and should be recorded as
                what happened, not rounded to what was expected. Saying so
                here stops it being read as a mistake. */}
            {isValid && difference !== 0 && (
              <p className="mt-1 text-xs text-amber-700">
                {difference > 0
                  ? `$${difference.toFixed(2)} more than the $${target.expected} owed — the extra is recorded as received.`
                  : `$${Math.abs(difference).toFixed(2)} short of the $${target.expected} owed — the rest stays outstanding.`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="pay-method">
                How they paid
              </label>
              <select
                id="pay-method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={field}
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="pay-date">
                Date received
              </label>
              <input
                id="pay-date"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className={field}
              />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="pay-ref">
              Confirmation number{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="pay-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e-Transfer reference, cheque number…"
              className={field}
            />
            <p className="mt-1 text-xs text-gray-500">
              Saved with the payment so you can match it to your bank statement
              later.
            </p>
          </div>

          <div>
            <label className={label} htmlFor="pay-note">
              Note <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="pay-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Paid with brother's registration"
              className={field}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 p-5">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={isSaving || !isValid}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c4291f] disabled:opacity-50"
          >
            {isSaving && <Loader2 size={15} className="animate-spin" />}
            Record payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordPaymentDialog;
