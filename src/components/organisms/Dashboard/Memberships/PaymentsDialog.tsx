"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Receipt, Trash2, X } from "lucide-react";
import {
  MemberProgram,
  PaymentMethod,
  PlayerPayment,
  UpdatePaymentDto,
} from "./types";
import { dayOf, prettyDay } from "./PaidPeriodPicker";

/**
 * Memberships → Payments: every payment recorded for one player, with
 * Edit and Delete.
 *
 * - Delete is for money entered by mistake (a duplicate, the wrong child).
 *   It also stops the payment counting towards the player's Indoor / League
 *   registration, lowers the payment count, and puts the paid dates back to
 *   what the previous payment gave them.
 * - Edit fixes the amount, the day it arrived, the method, the note, and
 *   which season it counts towards. It never changes the paid dates — that
 *   stays in "Change paid dates", so the two can't fight each other.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const METHOD_LABEL: Record<string, string> = {
  etransfer: "E-transfer",
  cash: "Cash",
  other: "Other",
  stripe: "Card (online)",
};

const money = (n: number) =>
  `$${Number(n).toLocaleString("en-CA", {
    minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

const todayDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const programLabel = (p: MemberProgram) =>
  `${p.seasonName} · ${p.ageGroup} — paid ${money(p.amountPaid)} of ${money(
    p.feeTotal
  )}`;

const linkLabel = (link: NonNullable<PlayerPayment["countsToward"]>) =>
  `${link.seasonName} · ${link.ageGroup} · ${
    link.installment === 1 ? "1st" : "2nd"
  } payment`;

const errorText = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    return Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || fallback;
  } catch {
    return fallback;
  }
};

interface Props {
  playerId: number;
  playerName: string;
  /** The player's season registrations (from the overview row). */
  programs: MemberProgram[];
  token: string | undefined;
  onClose: () => void;
  /** Something changed — the parent reloads the list. */
  onChanged: (message: string) => void;
}

const PaymentsDialog = ({
  playerId,
  playerName,
  programs,
  token,
  onClose,
  onChanged,
}: Props) => {
  const [payments, setPayments] = useState<PlayerPayment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Edit form
  const [editId, setEditId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("etransfer");
  const [note, setNote] = useState("");
  // "" = membership only (no season); otherwise a registration id.
  const [linkTo, setLinkTo] = useState("");

  const seasons = programs.filter((p) => p.status !== "withdrawn");

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await fetch(
        `${API_URL}/membership/${playerId}/payments`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error(await errorText(response, "Could not load payments"));
      }
      const data: PlayerPayment[] = await response.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load payments");
    }
  }, [playerId, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && busyId === null) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busyId, onClose]);

  const startEdit = (p: PlayerPayment) => {
    setError(null);
    setInfo(null);
    setConfirmDeleteId(null);
    setEditId(p.id);
    setAmount(String(p.amount));
    setPaidAt(dayOf(p.paidAt));
    setMethod(
      (["etransfer", "cash", "other"].includes(p.method)
        ? p.method
        : "other") as PaymentMethod
    );
    setNote(p.note ?? "");
    setLinkTo(p.countsToward ? String(p.countsToward.registrationId) : "");
  };

  const saveEdit = async (p: PlayerPayment) => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!paidAt) {
      setError("Please choose the day the money arrived");
      return;
    }
    if (paidAt > todayDay()) {
      setError("The payment date can't be in the future");
      return;
    }
    const body: UpdatePaymentDto = {};
    if (value !== Number(p.amount)) body.amount = value;
    if (paidAt !== dayOf(p.paidAt)) body.paidAt = paidAt;
    if (method !== p.method) body.method = method;
    if (note.trim() !== (p.note ?? "")) body.note = note.trim();
    const currentLink = p.countsToward
      ? String(p.countsToward.registrationId)
      : "";
    if (linkTo !== currentLink) {
      body.registrationId = linkTo ? Number(linkTo) : null;
    }
    if (!Object.keys(body).length) {
      setEditId(null);
      return;
    }
    try {
      setBusyId(p.id);
      setError(null);
      const response = await fetch(`${API_URL}/membership/payments/${p.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(await errorText(response, "Could not save the payment"));
      }
      setEditId(null);
      setInfo("Payment updated.");
      await load();
      onChanged(`Payment updated for ${playerName}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the payment");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p: PlayerPayment) => {
    try {
      setBusyId(p.id);
      setError(null);
      const response = await fetch(`${API_URL}/membership/payments/${p.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(await errorText(response, "Could not delete the payment"));
      }
      const result: {
        periodRestored: boolean;
        row?: {
          currentSubscriptionStartDate: string | null;
          currentSubscriptionEndDate: string | null;
        };
      } = await response.json();
      setConfirmDeleteId(null);
      const start = dayOf(result.row?.currentSubscriptionStartDate);
      const end = dayOf(result.row?.currentSubscriptionEndDate);
      setInfo(
        result.periodRestored && end
          ? `Payment deleted. Paid dates set back to ${
              start ? `${prettyDay(start, true)} – ` : "until "
            }${prettyDay(end, true)}.`
          : p.type === "league"
            ? "Payment deleted."
            : "Payment deleted. The paid dates were not changed — use “Change paid dates” if they need fixing."
      );
      await load();
      onChanged(`Payment of ${money(p.amount)} deleted for ${playerName}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the payment");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Payments for ${playerName}`}
    >
      <div className="absolute inset-0" onClick={() => busyId === null && onClose()} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl md:p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Receipt size={18} className="text-[#E43125]" /> Payments
        </h2>
        <p className="mb-4 text-sm text-gray-500">{playerName}</p>

        {info && (
          <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            {info}
          </p>
        )}
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {loadError ? (
          <div className="text-sm text-red-700">
            {loadError}{" "}
            <button onClick={load} className="underline">
              Try again
            </button>
          </div>
        ) : payments === null ? (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" /> Loading payments…
          </div>
        ) : payments.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">
            No payments recorded for this player.
          </p>
        ) : (
          <ul className="space-y-3">
            {payments.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-gray-200 p-3"
                data-testid={`payment-${p.id}`}
              >
                {editId === p.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor={`edit-amount-${p.id}`}
                          className="mb-1 block text-xs font-medium text-gray-700"
                        >
                          Amount
                        </label>
                        <input
                          id={`edit-amount-${p.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`edit-date-${p.id}`}
                          className="mb-1 block text-xs font-medium text-gray-700"
                        >
                          Date received
                        </label>
                        <input
                          id={`edit-date-${p.id}`}
                          type="date"
                          value={paidAt}
                          max={todayDay()}
                          onChange={(e) => setPaidAt(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor={`edit-method-${p.id}`}
                        className="mb-1 block text-xs font-medium text-gray-700"
                      >
                        Method
                      </label>
                      <select
                        id={`edit-method-${p.id}`}
                        value={method}
                        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="etransfer">E-transfer</option>
                        <option value="cash">Cash</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {seasons.length > 0 && (
                      <div>
                        <label
                          htmlFor={`edit-link-${p.id}`}
                          className="mb-1 block text-xs font-medium text-gray-700"
                        >
                          Counts toward
                        </label>
                        <select
                          id={`edit-link-${p.id}`}
                          value={linkTo}
                          onChange={(e) => setLinkTo(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Membership only (no season)</option>
                          {seasons.map((s) => (
                            <option key={s.registrationId} value={s.registrationId}>
                              {programLabel(s)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor={`edit-note-${p.id}`}
                        className="mb-1 block text-xs font-medium text-gray-700"
                      >
                        Note
                      </label>
                      <input
                        id={`edit-note-${p.id}`}
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. 380 + 75 uniform"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Saving doesn&apos;t change the paid dates — use
                      &ldquo;Change paid dates&rdquo; for that.
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditId(null)}
                        disabled={busyId === p.id}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(p)}
                        disabled={busyId === p.id}
                        className="flex items-center gap-1 rounded-lg bg-[#E43125] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {busyId === p.id && (
                          <Loader2 size={14} className="animate-spin" />
                        )}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-gray-900">
                          {money(p.amount)}
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            {prettyDay(dayOf(p.paidAt), true)} ·{" "}
                            {METHOD_LABEL[p.method] ?? p.method}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {p.countsToward ? (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-800">
                              {linkLabel(p.countsToward)}
                            </span>
                          ) : (
                            <span className="text-gray-500">
                              {p.type === "league"
                                ? "League fee"
                                : "Membership only"}
                            </span>
                          )}
                          {p.type !== "league" && p.subscriptionEndDate && (
                            <span className="ml-2 text-gray-500">
                              paid until{" "}
                              {prettyDay(dayOf(p.subscriptionEndDate), true)}
                            </span>
                          )}
                        </p>
                        {(p.note || p.periodLabel) && (
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {[p.periodLabel, p.note].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => startEdit(p)}
                          disabled={busyId !== null}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          aria-label={`Edit ${money(p.amount)} payment`}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setInfo(null);
                            setError(null);
                            setEditId(null);
                            setConfirmDeleteId(p.id);
                          }}
                          disabled={busyId !== null}
                          className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Delete ${money(p.amount)} payment`}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {confirmDeleteId === p.id && (
                      <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                        <p>
                          Delete this {money(p.amount)} payment from{" "}
                          {prettyDay(dayOf(p.paidAt), true)}?
                          {p.countsToward &&
                            ` It will stop counting toward ${p.countsToward.seasonName}.`}{" "}
                          This can&apos;t be undone.
                        </p>
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={busyId === p.id}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-gray-700"
                          >
                            Keep it
                          </button>
                          <button
                            onClick={() => remove(p)}
                            disabled={busyId === p.id}
                            className="flex items-center gap-1 rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                          >
                            {busyId === p.id && (
                              <Loader2 size={14} className="animate-spin" />
                            )}
                            Delete payment
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            disabled={busyId !== null}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentsDialog;
