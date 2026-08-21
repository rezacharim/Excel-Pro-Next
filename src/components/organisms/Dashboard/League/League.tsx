"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Undo2,
  XCircle,
} from "lucide-react";
import RecordPaymentDialog, {
  type RecordPaymentPayload,
  type RecordPaymentTarget,
} from "./RecordPaymentDialog";
import AddRegistrationDialog, {
  type AddRegistrationPayload,
} from "./AddRegistrationDialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const AGE_GROUPS = ["U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16"];

interface Installment {
  number: number;
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
}

interface Registration {
  id: number;
  ageGroup: string;
  teamName: string | null;
  player: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  city: string | null;
  parentName: string | null;
  status: string;
  isLate: boolean;
  feeTotal: number;
  amountPaid: number;
  balance: number;
  installments: Installment[];
  medicalNotes: string | null;
  createdAt: string;
}

interface Totals {
  registrations: number;
  confirmed: number;
  pending: number;
  waitlist: number;
  expected: number;
  collected: number;
  outstanding: number;
}

interface Outstanding {
  registrationId: number;
  player: string;
  ageGroup: string;
  parentName: string | null;
  email: string;
  phone: string;
  installment: number;
  amount: number;
  due: string | null;
  daysOverdue: number | null;
}

const STATUS: Record<string, { label: string; className: string }> = {
  pending_payment: { label: "Awaiting payment", className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-800" },
  submitted: { label: "On roster", className: "bg-blue-100 text-blue-800" },
  waitlist: { label: "Waiting list", className: "bg-gray-200 text-gray-700" },
  withdrawn: { label: "Withdrawn", className: "bg-gray-100 text-gray-500" },
};

const money = (n: number) => `$${Number(n || 0).toLocaleString("en-CA")}`;

const shortDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
};

const League = () => {
  const token = Cookies.get("auth_token");

  const [rows, setRows] = useState<Registration[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [seasonName, setSeasonName] = useState<string>("");
  const [outstanding, setOutstanding] = useState<Outstanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const [ageGroup, setAgeGroup] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"registrations" | "outstanding">("registrations");
  const [isExporting, setIsExporting] = useState(false);
  const [payTarget, setPayTarget] = useState<RecordPaymentTarget | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const showToast = useCallback((kind: "success" | "error", message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const auth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const params = new URLSearchParams();
      if (ageGroup) params.set("ageGroup", ageGroup);
      if (status) params.set("status", status);
      if (search.trim()) params.set("search", search.trim());

      const [regRes, outRes] = await Promise.all([
        fetch(`${API_URL}/league/admin/registrations?${params}`, { headers: auth }),
        fetch(`${API_URL}/league/admin/outstanding`, { headers: auth }),
      ]);
      if (!regRes.ok) throw new Error("Could not load registrations");

      const data = await regRes.json();
      setRows(data.rows ?? []);
      setTotals(data.totals ?? null);
      setSeasonName(data.season?.name ?? "");
      if (outRes.ok) setOutstanding(await outRes.json());
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Could not load the league data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [auth, ageGroup, status, search]);

  useEffect(() => {
    // Debounced so typing in the search box does not fire a request per key.
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  /**
   * Marking money as received is the one action that confirms a roster spot.
   *
   * Throws rather than showing a toast on failure: the dialog stays open with
   * the error next to the fields, so a mistyped amount can be corrected
   * without retyping the rest.
   */
  const recordPayment = async (payload: RecordPaymentPayload) => {
    if (!payTarget) return;
    const registrationId = payTarget.registrationId;
    setBusyId(registrationId);
    try {
      const res = await fetch(
        `${API_URL}/league/admin/registrations/${registrationId}/payments`,
        {
          method: "POST",
          headers: { ...auth, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Could not record the payment");
      }
      setPayTarget(null);
      showToast(
        "success",
        `Payment ${payload.installment} recorded — receipt emailed`
      );
      load();
    } finally {
      setBusyId(null);
    }
  };

  /** Adding a family who registered somewhere other than the website form. */
  const addRegistration = async (payload: AddRegistrationPayload) => {
    const res = await fetch(`${API_URL}/league/admin/registrations`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        Array.isArray(body.message)
          ? body.message.join(", ")
          : body.message || "Could not add the registration"
      );
    }
    setIsAdding(false);
    showToast(
      "success",
      `${payload.firstName} ${payload.lastName} added — record the first payment to hold the spot`
    );
    load();
  };

  const reversePayment = async (registrationId: number, installment: number) => {
    setBusyId(registrationId);
    try {
      const res = await fetch(
        `${API_URL}/league/admin/registrations/${registrationId}/payments/${installment}/reverse`,
        { method: "POST", headers: auth }
      );
      if (!res.ok) throw new Error("Could not undo the payment");
      showToast("success", "Payment removed");
      load();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Checks the roster before downloading. The league rejects rows with a
   * missing date of birth or postal code, and finding that out after filing
   * is far more expensive than finding out here.
   */
  const exportRoster = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (ageGroup) params.set("ageGroup", ageGroup);

      const check = await fetch(`${API_URL}/league/admin/roster/check?${params}`, {
        headers: auth,
      });
      if (check.ok) {
        const report = await check.json();
        if (report.players === 0) {
          showToast(
            "error",
            "No confirmed players to export yet. Record a first payment to confirm a spot."
          );
          return;
        }
        if (report.issues?.length) {
          const names = report.issues
            .slice(0, 3)
            .map((i: { player: string }) => i.player)
            .join(", ");
          showToast(
            "error",
            `${report.issues.length} player(s) are missing details the league requires: ${names}${
              report.issues.length > 3 ? "…" : ""
            }`
          );
          return;
        }
      }

      const res = await fetch(`${API_URL}/league/admin/roster/export?${params}`, {
        headers: auth,
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${ageGroup || "All age groups"} - ${seasonName || "League"}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("success", "Roster downloaded");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const copyChaseList = () => {
    const text = outstanding
      .map(
        (o) =>
          `${o.player} (${o.ageGroup}) — ${money(o.amount)} — ${o.email} — ${o.phone}`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    showToast("success", "Copied — paste into your email or WhatsApp");
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">League Registrations</h1>
          <p className="text-gray-600 text-sm mt-1">
            {seasonName || "No active season"} — record payments and export the
            roster for PISL / YRSL
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <Plus size={16} />
            Add registration
          </button>
          <button
            onClick={exportRoster}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#E43125] hover:bg-[#c4291f] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Export roster{ageGroup ? ` (${ageGroup})` : ""}
          </button>
        </div>
      </div>

      {/* ---- money at a glance ---- */}
      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Registrations", value: totals.registrations, tone: "text-gray-900" },
            { label: "Confirmed", value: totals.confirmed, tone: "text-green-700" },
            { label: "Awaiting payment", value: totals.pending, tone: "text-amber-600" },
            { label: "Collected", value: money(totals.collected), tone: "text-green-700" },
            { label: "Outstanding", value: money(totals.outstanding), tone: "text-[#E43125]" },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {card.label}
              </p>
              <p className={`text-2xl font-bold mt-1 ${card.tone}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ---- tabs ---- */}
      <div className="flex gap-2 mb-4">
        {(["registrations", "outstanding"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              tab === t
                ? "bg-[#E43125] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t === "registrations"
              ? "All registrations"
              : `Who owes money (${outstanding.length})`}
          </button>
        ))}
      </div>

      {tab === "registrations" && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email"
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-64"
            />
          </div>
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">All age groups</option>
            {AGE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">Any status</option>
            <option value="pending_payment">Awaiting payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="waitlist">Waiting list</option>
            <option value="submitted">On roster</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      )}

      {toast && (
        <div
          className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
            toast.kind === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {toast.kind === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {toast.message}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
          Loading…
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">{loadError}</p>
          <button
            onClick={load}
            className="px-4 py-2 bg-[#E43125] text-white rounded-lg text-sm font-medium"
          >
            Try again
          </button>
        </div>
      ) : tab === "registrations" ? (
        rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-600">
            No registrations match these filters yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  {["Player", "Age", "Status", "Paid", "1st payment", "2nd payment", "Contact"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-semibold whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const s = STATUS[r.status] ?? STATUS.pending_payment;
                  return (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{r.player}</p>
                        <p className="text-xs text-gray-500">
                          {r.parentName || "—"} · born {shortDate(r.dateOfBirth)}
                        </p>
                        {r.medicalNotes && (
                          <p className="text-xs text-amber-700 mt-1">
                            ⚕ {r.medicalNotes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">{r.ageGroup}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${s.className}`}
                        >
                          {s.label}
                        </span>
                        {r.isLate && (
                          <span className="block text-xs text-[#E43125] mt-1">
                            late fee
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-green-700">
                          {money(r.amountPaid)}
                        </span>
                        <span className="text-gray-400"> / {money(r.feeTotal)}</span>
                      </td>

                      {r.installments.map((i) => (
                        <td key={i.number} className="px-4 py-3 whitespace-nowrap">
                          {i.amount === 0 ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : i.paidAt ? (
                            <div className="flex items-center gap-2">
                              <span className="text-green-700 text-xs font-semibold">
                                ✓ {shortDate(i.paidAt)}
                              </span>
                              <button
                                onClick={() => reversePayment(r.id, i.number)}
                                disabled={busyId === r.id}
                                title="Undo this payment"
                                className="text-gray-400 hover:text-[#E43125]"
                              >
                                <Undo2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setPayTarget({
                                  registrationId: r.id,
                                  player: r.player,
                                  installment: i.number,
                                  expected: i.amount,
                                })
                              }
                              disabled={busyId === r.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-green-50 hover:border-green-300 disabled:opacity-50"
                            >
                              {busyId === r.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : null}
                              Mark {money(i.amount)} received
                            </button>
                          )}
                        </td>
                      ))}

                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        <a href={`mailto:${r.email}`} className="hover:underline block">
                          {r.email}
                        </a>
                        <a href={`tel:${r.phone}`} className="hover:underline">
                          {r.phone}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : outstanding.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-600">
          Nobody owes anything. Everyone is paid up.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Most overdue first. Copy the list to paste into an email or WhatsApp.
            </p>
            <button
              onClick={copyChaseList}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Copy list
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                {["Player", "Age", "Owes", "Due", "Overdue", "Contact"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outstanding.map((o) => (
                <tr
                  key={`${o.registrationId}-${o.installment}`}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{o.player}</p>
                    <p className="text-xs text-gray-500">{o.parentName || "—"}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{o.ageGroup}</td>
                  <td className="px-4 py-3 font-semibold text-[#E43125]">
                    {money(o.amount)}
                    <span className="block text-xs font-normal text-gray-500">
                      payment {o.installment}
                    </span>
                  </td>
                  <td className="px-4 py-3">{shortDate(o.due)}</td>
                  <td className="px-4 py-3">
                    {o.daysOverdue !== null && o.daysOverdue > 0 ? (
                      <span className="text-[#E43125] font-semibold">
                        {o.daysOverdue} days
                      </span>
                    ) : (
                      <span className="text-gray-400">not yet due</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <a href={`mailto:${o.email}`} className="hover:underline block">
                      {o.email}
                    </a>
                    <a href={`tel:${o.phone}`} className="hover:underline">
                      {o.phone}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RecordPaymentDialog
        target={payTarget}
        onCancel={() => setPayTarget(null)}
        onSubmit={recordPayment}
      />

      <AddRegistrationDialog
        open={isAdding}
        ageGroups={AGE_GROUPS}
        seasonName={seasonName}
        onCancel={() => setIsAdding(false)}
        onSubmit={addRegistration}
      />
    </div>
  );
};

export default League;
