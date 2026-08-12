"use client";

import { NextPage } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Download,
  Loader2,
  Lock,
  PiggyBank,
  RefreshCw,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import {
  BreakdownSlice,
  FinanceMonthRow,
  FinanceRecentPayment,
  FinanceSummary,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SESSION_EXPIRED_MESSAGE =
  "Your session expired — please sign in again.";

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface ToastState {
  kind: "success" | "error";
  message: string;
}

/** Anything off the wire may be null, a string decimal, or missing entirely. */
const toNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toCount = (value: unknown): number => Math.max(0, Math.round(toNumber(value)));

/** CAD with cents only when there are cents — "$1,234", "$1,234.50". */
const formatMoney = (value: unknown): string => {
  const amount = toNumber(value);
  const hasCents = Math.round(Math.abs(amount) * 100) % 100 !== 0;
  return `$${amount.toLocaleString("en-CA", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};

/** Shortened form for the ~24px-wide labels above chart bars. */
const formatMoneyCompact = (value: unknown): string => {
  const amount = toNumber(value);
  if (Math.abs(amount) >= 1000) {
    const thousands = Math.round(amount / 100) / 10;
    return `$${thousands.toLocaleString("en-CA")}k`;
  }
  return `$${Math.round(amount).toLocaleString("en-CA")}`;
};

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const methodLabel = (method: string | null | undefined): string => {
  const raw = (method || "").trim();
  switch (raw.toLowerCase()) {
    case "etransfer":
      return "E-transfer";
    case "cash":
      return "Cash";
    case "stripe":
      return "Card";
    case "":
      return "—";
    default:
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }
};

/** What the owner actually paid for, in the words she uses herself. */
const paymentDescription = (payment: FinanceRecentPayment): string => {
  if (payment.periodLabel) return payment.periodLabel;
  if ((payment.type || "").toLowerCase() === "league") return "League fee";
  return "Membership — 2 months";
};

const shortMonthLabel = (row: FinanceMonthRow): string => {
  const fromLabel = (row.label || "").trim().split(" ")[0];
  if (fromLabel) return fromLabel;
  const monthNumber = parseInt((row.month || "").split("-")[1] ?? "", 10);
  return MONTH_ABBR[monthNumber - 1] ?? "—";
};

const emptySummary = (): FinanceSummary => ({
  collectedThisMonth: 0,
  collectedThisYear: 0,
  collectedAllTime: 0,
  outstandingAmount: 0,
  outstandingCount: 0,
  expectedNext30Days: 0,
  expectedNext30Count: 0,
  activeMembers: 0,
  byMonth: [],
  byType: { membership: 0, league: 0 },
  byMethod: { etransfer: 0, cash: 0, other: 0 },
  recentPayments: [],
});

/**
 * Coerce the payload into a shape the render code can trust, so a partial or
 * malformed response degrades to zeros instead of printing "$NaN" at the owner.
 */
const normalizeSummary = (raw: unknown): FinanceSummary => {
  const data = (raw ?? {}) as Partial<FinanceSummary>;
  const byMonth = Array.isArray(data.byMonth) ? data.byMonth : [];
  const recentPayments = Array.isArray(data.recentPayments)
    ? data.recentPayments
    : [];

  return {
    collectedThisMonth: toNumber(data.collectedThisMonth),
    collectedThisYear: toNumber(data.collectedThisYear),
    collectedAllTime: toNumber(data.collectedAllTime),
    outstandingAmount: toNumber(data.outstandingAmount),
    outstandingCount: toCount(data.outstandingCount),
    expectedNext30Days: toNumber(data.expectedNext30Days),
    expectedNext30Count: toCount(data.expectedNext30Count),
    activeMembers: toCount(data.activeMembers),
    byMonth: byMonth.filter(Boolean).map((row) => ({
      month: String(row?.month ?? ""),
      label: String(row?.label ?? ""),
      total: toNumber(row?.total),
      count: toCount(row?.count),
    })),
    byType: {
      membership: toNumber(data.byType?.membership),
      league: toNumber(data.byType?.league),
    },
    byMethod: {
      etransfer: toNumber(data.byMethod?.etransfer),
      cash: toNumber(data.byMethod?.cash),
      other: toNumber(data.byMethod?.other),
    },
    recentPayments: recentPayments.filter(Boolean).map((payment, index) => ({
      id: toNumber(payment?.id) || index,
      playerName: String(payment?.playerName || "Unknown player"),
      amount: toNumber(payment?.amount),
      method: String(payment?.method ?? ""),
      type: String(payment?.type ?? ""),
      periodLabel: payment?.periodLabel ? String(payment.periodLabel) : null,
      createdAt: String(payment?.createdAt ?? ""),
    })),
  };
};

const Finance: NextPage = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState<FinanceSummary>(emptySummary());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const savedToken = Cookies.get("auth_token");

  const yearOptions = useMemo(
    () => [currentYear, currentYear - 1, currentYear - 2, currentYear - 3],
    [currentYear]
  );

  const showToast = useCallback((kind: "success" | "error", message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchSummary = useCallback(async () => {
    try {
      setLoadError(null);
      setIsSessionExpired(false);
      const response = await fetch(`${API_URL}/finance/summary?year=${year}`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });
      if (response.status === 401) {
        setIsSessionExpired(true);
        setLoadError(SESSION_EXPIRED_MESSAGE);
        setSummary(emptySummary());
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch finance summary");
      }
      const data: unknown = await response.json();
      setSummary(normalizeSummary(data));
    } catch (error) {
      console.error("Error fetching finance summary:", error);
      setLoadError("Failed to load the money numbers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [savedToken, year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const exportCsv = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`${API_URL}/finance/export?year=${year}`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });
      if (response.status === 401) {
        throw new Error(SESSION_EXPIRED_MESSAGE);
      }
      if (!response.ok) {
        throw new Error("Failed to export payments");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `excel-pro-payments-${year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("success", `Payments for ${year} downloaded`);
    } catch (error) {
      console.error("Error exporting payments:", error);
      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Failed to download the file. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const months = summary.byMonth;
  const maxMonthTotal = useMemo(
    () => months.reduce((max, row) => Math.max(max, row.total), 0),
    [months]
  );

  /** Only the three biggest months get a printed amount; the rest would collide. */
  const labelledMonths = useMemo(() => {
    const top = months
      .map((row, index) => ({ index, total: row.total }))
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map((row) => row.index);
    return new Set(top);
  }, [months]);

  const chartRangeLabel = useMemo(() => {
    if (months.length === 0) return "";
    const first = months[0]?.label;
    const last = months[months.length - 1]?.label;
    return first && last ? `${first} – ${last}` : "";
  }, [months]);

  const typeSlices: BreakdownSlice[] = [
    { label: "Membership", amount: summary.byType.membership, color: "#E43125" },
    { label: "League", amount: summary.byType.league, color: "#F59E0B" },
  ];

  const methodSlices: BreakdownSlice[] = [
    { label: "E-transfer", amount: summary.byMethod.etransfer, color: "#E43125" },
    { label: "Cash", amount: summary.byMethod.cash, color: "#10B981" },
    { label: "Other", amount: summary.byMethod.other, color: "#6B7280" },
  ];

  const summaryCards = [
    {
      label: "Collected this month",
      value: formatMoney(summary.collectedThisMonth),
      note: "So far this calendar month",
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      iconBg: "bg-green-100",
      valueClass: "text-gray-900",
      cardClass: "border-gray-200 bg-white",
    },
    {
      label: `Collected in ${year}`,
      value: formatMoney(summary.collectedThisYear),
      note: `All payments received in ${year}`,
      icon: <PiggyBank className="w-5 h-5 text-blue-600" />,
      iconBg: "bg-blue-100",
      valueClass: "text-gray-900",
      cardClass: "border-gray-200 bg-white",
    },
    {
      label: "Outstanding",
      value: formatMoney(summary.outstandingAmount),
      note: `from ${summary.outstandingCount} famil${
        summary.outstandingCount === 1 ? "y" : "ies"
      }`,
      icon: <AlertTriangle className="w-5 h-5 text-[#E43125]" />,
      iconBg: "bg-red-100",
      valueClass: "text-[#E43125]",
      cardClass: "border-red-200 bg-red-50",
    },
    {
      label: "Expected next 30 days",
      value: formatMoney(summary.expectedNext30Days),
      note: `${summary.expectedNext30Count} renewal${
        summary.expectedNext30Count === 1 ? "" : "s"
      } due`,
      icon: <CalendarClock className="w-5 h-5 text-amber-600" />,
      iconBg: "bg-amber-100",
      valueClass: "text-gray-900",
      cardClass: "border-gray-200 bg-white",
    },
  ];

  const renderBreakdown = (title: string, slices: BreakdownSlice[]) => {
    const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5">
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <span className="text-xs md:text-sm text-gray-500">
            {formatMoney(total)} total
          </span>
        </div>
        {total <= 0 ? (
          <p className="text-sm text-gray-500">No payments in {year} yet.</p>
        ) : (
          <div className="space-y-4">
            {slices.map((slice) => {
              const share = total > 0 ? (slice.amount / total) * 100 : 0;
              return (
                <div key={slice.label}>
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <span className="text-sm text-gray-700">{slice.label}</span>
                    <span className="text-sm text-gray-900">
                      <span className="font-medium">
                        {formatMoney(slice.amount)}
                      </span>
                      <span className="text-gray-500 ml-1.5">
                        {Math.round(share)}%
                      </span>
                    </span>
                  </div>
                  <div
                    className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden"
                    role="img"
                    aria-label={`${slice.label}: ${formatMoney(
                      slice.amount
                    )}, ${Math.round(share)} percent`}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(share, slice.amount > 0 ? 2 : 0)}%`,
                        backgroundColor: slice.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen rounded-lg">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Money</h1>
          <p className="text-gray-500 text-sm md:text-base">
            What came in, what is still owed, and what is coming next
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={year}
            onChange={(e) => {
              setIsLoading(true);
              setYear(parseInt(e.target.value, 10) || currentYear);
            }}
            aria-label="Choose year"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium"
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] transition-colors text-sm font-medium disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Download size={16} />
            )}
            Download for bookkeeper (CSV)
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16 border border-gray-200 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading the numbers...</span>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-gray-200 rounded-lg">
          {isSessionExpired ? (
            <Lock className="w-10 h-10 text-gray-400 mb-3" />
          ) : (
            <XCircle className="w-10 h-10 text-red-500 mb-3" />
          )}
          <p className="text-gray-700 mb-4">{loadError}</p>
          {/* Retrying an expired token just fails again — only offer it for real errors. */}
          {!isSessionExpired && (
            <button
              onClick={() => {
                setIsLoading(true);
                fetchSummary();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] text-sm"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className={`border rounded-lg p-4 flex items-start gap-3 ${card.cardClass}`}
              >
                <div
                  className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}
                >
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-xl md:text-2xl font-bold leading-tight break-words ${card.valueClass}`}
                  >
                    {card.value}
                  </div>
                  <div className="text-gray-600 text-xs md:text-sm font-medium">
                    {card.label}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">{card.note}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mb-6">
            All time: {formatMoney(summary.collectedAllTime)} collected ·{" "}
            {summary.activeMembers} active member
            {summary.activeMembers === 1 ? "" : "s"}
          </p>

          {/* 12-month bar chart, hand-built from divs */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-5">
              <h2 className="font-semibold text-gray-900">
                Money collected each month
              </h2>
              <span className="text-xs md:text-sm text-gray-500">
                {chartRangeLabel
                  ? `${chartRangeLabel} · always the last 12 months`
                  : "Last 12 months"}
              </span>
            </div>

            {months.length === 0 || maxMonthTotal <= 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                No payments recorded in the last 12 months yet — the chart will
                fill in as money comes in.
              </div>
            ) : (
              <div className="flex items-end gap-1 sm:gap-2">
                {months.map((row, index) => {
                  const heightPercent =
                    maxMonthTotal > 0 ? (row.total / maxMonthTotal) * 100 : 0;
                  const barTitle = `${row.label || shortMonthLabel(row)}: ${formatMoney(
                    row.total
                  )} from ${row.count} payment${row.count === 1 ? "" : "s"}`;
                  return (
                    <div
                      key={row.month || index}
                      title={barTitle}
                      className="flex-1 min-w-0 flex flex-col items-center"
                    >
                      <div className="h-4 w-full text-center text-[9px] sm:text-[10px] text-gray-600 leading-4 truncate">
                        {labelledMonths.has(index)
                          ? formatMoneyCompact(row.total)
                          : ""}
                      </div>
                      <div className="h-32 sm:h-40 w-full flex items-end">
                        <div
                          className="w-full rounded-t"
                          style={{
                            // A tiny month still needs to be visible as a sliver.
                            height:
                              row.total > 0
                                ? `${Math.max(heightPercent, 3)}%`
                                : "2px",
                            backgroundColor:
                              row.total > 0 ? "#E43125" : "#E5E7EB",
                          }}
                        />
                      </div>
                      <div className="mt-2 w-full text-center text-[9px] sm:text-[11px] text-gray-500 truncate">
                        {shortMonthLabel(row)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
            {renderBreakdown("By type", typeSlices)}
            {renderBreakdown("By payment method", methodSlices)}
          </div>

          {/* Recent payments */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Recent payments</h2>
              <p className="text-gray-500 text-xs md:text-sm">
                The latest money received
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th
                      scope="col"
                      className="text-left py-3 px-4 md:px-6 font-medium text-gray-600 text-sm whitespace-nowrap"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 md:px-6 font-medium text-gray-600 text-sm whitespace-nowrap"
                    >
                      Player
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 md:px-6 font-medium text-gray-600 text-sm whitespace-nowrap"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 md:px-6 font-medium text-gray-600 text-sm whitespace-nowrap"
                    >
                      Method
                    </th>
                    <th
                      scope="col"
                      className="text-right py-3 px-4 md:px-6 font-medium text-gray-600 text-sm whitespace-nowrap"
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentPayments.length > 0 ? (
                    summary.recentPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 md:px-6 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="py-3 px-4 md:px-6 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {payment.playerName}
                        </td>
                        <td className="py-3 px-4 md:px-6 text-sm text-gray-600">
                          {paymentDescription(payment)}
                        </td>
                        <td className="py-3 px-4 md:px-6 text-sm text-gray-600 whitespace-nowrap">
                          {methodLabel(payment.method)}
                        </td>
                        <td className="py-3 px-4 md:px-6 text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                          {formatMoney(payment.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-gray-500 text-sm"
                      >
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${
            toast.kind === "success" ? "bg-green-600" : "bg-[#E43125]"
          }`}
        >
          {toast.kind === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <XCircle size={18} />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/80 hover:text-white"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Finance;
