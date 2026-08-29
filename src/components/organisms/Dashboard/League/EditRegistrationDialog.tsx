"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw, X } from "lucide-react";

export interface EditRegistrationTarget {
  id: number;
  player: string;
  ageGroup: string;
  status: string;
  isLate: boolean;
  feeTotal: number;
  amountPaid: number;
  installments: {
    number: number;
    amount: number;
    dueDate: string | null;
    paidAt: string | null;
  }[];
}

export interface EditRegistrationPayload {
  status?: string;
  ageGroup?: string;
  feeTotal?: number;
  firstAmount?: number;
  secondAmount?: number;
  firstDueDate?: string;
  secondDueDate?: string;
  isLate?: boolean;
  adminNote?: string;
  resetFeesToSeason?: boolean;
}

const STATUSES = [
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "waitlist", label: "Waiting list" },
  { value: "submitted", label: "On roster" },
  { value: "withdrawn", label: "Withdrawn" },
];

const dateOnly = (iso: string | null) =>
  iso ? String(iso).slice(0, 10) : "";

/**
 * Correcting one registration's money and status.
 *
 * The fee is copied onto a registration when it is created, which is right —
 * a roster filed with the league should not change under you — but it left no
 * way to fix a fee that was wrong at the moment of creation. The case that
 * forced this: the late fee started on 25 August while the deadline was still
 * being extended, so three families were charged $1,100 for a $900 season.
 *
 * "Back to the season rate" is the one-click version of that fix. The fields
 * below it are for everything else — a family paying in uneven amounts, a
 * date pushed back, a status corrected.
 */
const EditRegistrationDialog = ({
  target,
  ageGroups,
  onCancel,
  onSubmit,
}: {
  target: EditRegistrationTarget | null;
  ageGroups: string[];
  onCancel: () => void;
  onSubmit: (payload: EditRegistrationPayload) => Promise<void>;
}) => {
  const [status, setStatus] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [feeTotal, setFeeTotal] = useState("");
  const [firstAmount, setFirstAmount] = useState("");
  const [secondAmount, setSecondAmount] = useState("");
  const [firstDue, setFirstDue] = useState("");
  const [secondDue, setSecondDue] = useState("");
  const [isLate, setIsLate] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    const first = target.installments.find((i) => i.number === 1);
    const second = target.installments.find((i) => i.number === 2);
    setStatus(target.status);
    setAgeGroup(target.ageGroup);
    setFeeTotal(String(target.feeTotal));
    setFirstAmount(String(first?.amount ?? 0));
    setSecondAmount(String(second?.amount ?? 0));
    setFirstDue(dateOnly(first?.dueDate ?? null));
    setSecondDue(dateOnly(second?.dueDate ?? null));
    setIsLate(target.isLate);
    setAdminNote("");
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

  const anyPaid = target.installments.some((i) => i.paidAt);
  const total = Number(feeTotal) || 0;
  const split = (Number(firstAmount) || 0) + (Number(secondAmount) || 0);
  const mismatch = Math.abs(split - total) > 0.005;

  const send = async (payload: EditRegistrationPayload) => {
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the changes");
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
  };

  const resetToSeason = () =>
    send({ resetFeesToSeason: true, adminNote: adminNote.trim() || undefined });

  const save = () =>
    send({
      status,
      ageGroup,
      feeTotal: total,
      firstAmount: Number(firstAmount) || 0,
      secondAmount: Number(secondAmount) || 0,
      firstDueDate: firstDue || undefined,
      secondDueDate: secondDue || undefined,
      isLate,
      adminNote: adminNote.trim() || undefined,
    });

  const field =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E43125]/30 focus:border-[#E43125]";
  const label = "block text-xs font-semibold text-gray-700 mb-1";
  const section =
    "mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-4 w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Edit registration
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

        <div className="space-y-5 p-5">
          {/* ---- the one-click fix ---- */}
          {target.isLate && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                Charged the late fee
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                This player is on ${target.feeTotal}. Put them back on the
                season&apos;s standard fee and due dates in one click.
              </p>
              <button
                onClick={resetToSeason}
                disabled={isSaving || anyPaid}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RotateCcw size={13} />
                )}
                Back to the season rate
              </button>
              {anyPaid && (
                <p className="mt-2 text-xs text-amber-800">
                  A payment is already recorded, so this is disabled — undo the
                  payment first, or set the amounts by hand below.
                </p>
              )}
            </div>
          )}

          <div>
            <p className={section}>Status</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="edit-status">
                  Registration status
                </label>
                <select
                  id="edit-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={field}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="edit-age">
                  Age group
                </label>
                <select
                  id="edit-age"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className={field}
                >
                  {ageGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className={section}>Fee</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="edit-total">
                  Total for the season
                </label>
                <input
                  id="edit-total"
                  type="number"
                  min="0"
                  step="0.01"
                  value={feeTotal}
                  onChange={(e) => setFeeTotal(e.target.value)}
                  className={field}
                />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isLate}
                  onChange={(e) => setIsLate(e.target.checked)}
                />
                <span>Show &quot;late fee&quot; on this row</span>
              </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="edit-a1">
                  1st payment
                </label>
                <input
                  id="edit-a1"
                  type="number"
                  min="0"
                  step="0.01"
                  value={firstAmount}
                  onChange={(e) => setFirstAmount(e.target.value)}
                  disabled={Boolean(
                    target.installments.find((i) => i.number === 1)?.paidAt
                  )}
                  className={`${field} disabled:bg-gray-100 disabled:text-gray-400`}
                />
                <input
                  aria-label="First payment due date"
                  type="date"
                  value={firstDue}
                  onChange={(e) => setFirstDue(e.target.value)}
                  className={`${field} mt-2`}
                />
              </div>
              <div>
                <label className={label} htmlFor="edit-a2">
                  2nd payment
                </label>
                <input
                  id="edit-a2"
                  type="number"
                  min="0"
                  step="0.01"
                  value={secondAmount}
                  onChange={(e) => setSecondAmount(e.target.value)}
                  disabled={Boolean(
                    target.installments.find((i) => i.number === 2)?.paidAt
                  )}
                  className={`${field} disabled:bg-gray-100 disabled:text-gray-400`}
                />
                <input
                  aria-label="Second payment due date"
                  type="date"
                  value={secondDue}
                  onChange={(e) => setSecondDue(e.target.value)}
                  className={`${field} mt-2`}
                />
              </div>
            </div>

            {/* Not blocked — an uneven split is sometimes deliberate — but it
                is almost always a typo, so it is said out loud. */}
            {mismatch && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                The two payments add up to ${split.toFixed(2)}, but the total
                says ${total.toFixed(2)}. Fine if that is deliberate.
              </p>
            )}
            {anyPaid && (
              <p className="mt-2 text-xs text-gray-500">
                A greyed-out box means that payment is already recorded. Undo it
                on the League screen to change the amount.
              </p>
            )}
          </div>

          <div>
            <label className={label} htmlFor="edit-note">
              Note{" "}
              <span className="font-normal text-gray-400">
                (why you changed it)
              </span>
            </label>
            <input
              id="edit-note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Deadline extended to Sep 15, late fee removed"
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
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c4291f] disabled:opacity-50"
          >
            {isSaving && <Loader2 size={15} className="animate-spin" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRegistrationDialog;
