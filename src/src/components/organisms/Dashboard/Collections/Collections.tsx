"use client";

import { NextPage } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MessageSquarePlus,
  Phone,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  CollectionsFilter,
  CollectionsRow,
  ContactLogEntry,
  ContactMethod,
  CreateContactLogDto,
  SendReminderResult,
  SendRemindersResult,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SESSION_EXPIRED = "Your session expired — please sign in again.";

interface ToastState {
  kind: "success" | "error";
  message: string;
}

const METHOD_OPTIONS: { value: ContactMethod; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "text", label: "Text" },
  { value: "in_person", label: "In person" },
];

/** Readable name for any method string, including the backend's own entries. */
const methodLabel = (method?: string | null): string => {
  if (!method) return "Contact";
  switch (method) {
    case "call":
      return "Call";
    case "email":
      return "Email";
    case "text":
      return "Text";
    case "in_person":
      return "In person";
    case "reminder_email":
      return "Reminder email";
    default:
      return method;
  }
};

/** "Aug 10, 2026" — never "Invalid Date", even if the API sends junk. */
const formatDate = (iso?: string | null): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/** Same guards, but compact ("Aug 10") for inline mentions inside a sentence. */
const formatShortDate = (iso?: string | null): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
};

/** Money is shown to a non-technical owner, so it must never read "$NaN". */
const formatMoney = (value: unknown): string => {
  const amount = typeof value === "number" ? value : Number(value);
  const safe = isFinite(amount) ? amount : 0;
  return safe.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const toNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return isFinite(parsed) ? parsed : 0;
};

/** A promise to check back is "due" from the moment that day starts. */
const isFollowUpDue = (iso?: string | null): boolean => {
  if (!iso) return false;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return false;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return date.getTime() <= endOfToday.getTime();
};

const Collections: NextPage = () => {
  const [rows, setRows] = useState<CollectionsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<CollectionsFilter>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sendingUserId, setSendingUserId] = useState<number | null>(null);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Contact modal
  const [contactRow, setContactRow] = useState<CollectionsRow | null>(null);
  const [logs, setLogs] = useState<ContactLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logMethod, setLogMethod] = useState<ContactMethod>("call");
  const [logNote, setLogNote] = useState("");
  const [logFollowUpAt, setLogFollowUpAt] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  const savedToken = Cookies.get("auth_token");

  // Master switch for the daily automatic reminder emails.
  const [remindersPaused, setRemindersPaused] = useState<boolean | null>(null);
  const [isTogglingReminders, setIsTogglingReminders] = useState(false);

  const showToast = useCallback((kind: "success" | "error", message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  /** Pull the server's own wording out of a failed response where possible. */
  const readErrorMessage = async (
    response: Response,
    fallback: string
  ): Promise<string> => {
    if (response.status === 401) return SESSION_EXPIRED;
    try {
      const data = await response.json();
      const message = data?.message;
      if (Array.isArray(message)) return message.join(", ");
      if (typeof message === "string" && message.trim()) return message;
    } catch {
      // keep the fallback wording
    }
    return fallback;
  };

  const fetchCollections = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await fetch(`${API_URL}/collections`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            "Failed to load collections. Please try again."
          )
        );
      }
      const data = await response.json();
      const list: CollectionsRow[] = Array.isArray(data) ? data : [];
      setRows(list);
      // Families who have paid drop off the list — forget any stale ticks.
      setSelectedIds((previous) =>
        previous.filter((id) => list.some((row) => row.userId === id))
      );
    } catch (error) {
      console.error("Error fetching collections:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Failed to load collections. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [savedToken]);

  useEffect(() => {
    // Read the current pause state so the banner always reflects reality.
    (async () => {
      try {
        const res = await fetch(`${API_URL}/settings`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setRemindersPaused(Boolean(data.remindersPaused));
      } catch {
        // A settings failure must not stop the collections list loading.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleReminders = async (paused: boolean) => {
    setIsTogglingReminders(true);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${savedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ remindersPaused: paused }),
      });
      if (!res.ok) throw new Error("Could not change the setting");
      const data = await res.json();
      setRemindersPaused(Boolean(data.remindersPaused));
      showToast(
        "success",
        paused
          ? "Automatic reminder emails are paused"
          : "Automatic reminder emails are switched on"
      );
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not change the setting"
      );
    } finally {
      setIsTogglingReminders(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const counts = useMemo(() => {
    const neverContacted = rows.filter((r) => !r.lastContactAt).length;
    // Someone was spoken to and the money still has not arrived: either no
    // payment at all, or the last payment predates the conversation.
    const contactedUnpaid = rows.filter((r) => {
      if (!r.lastContactAt) return false;
      if (!r.lastPaymentAt) return true;
      const contacted = new Date(r.lastContactAt).getTime();
      const paid = new Date(r.lastPaymentAt).getTime();
      if (isNaN(contacted) || isNaN(paid)) return true;
      return paid <= contacted;
    }).length;
    const followUpDue = rows.filter((r) => isFollowUpDue(r.followUpAt)).length;
    const totalOwed = rows.reduce((sum, r) => sum + toNumber(r.amountDue), 0);
    return {
      all: rows.length,
      neverContacted,
      contactedUnpaid,
      followUpDue,
      totalOwed,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;

    if (filter === "never_contacted") {
      result = result.filter((r) => !r.lastContactAt);
    } else if (filter === "contacted_unpaid") {
      result = result.filter((r) => {
        if (!r.lastContactAt) return false;
        if (!r.lastPaymentAt) return true;
        const contacted = new Date(r.lastContactAt).getTime();
        const paid = new Date(r.lastPaymentAt).getTime();
        if (isNaN(contacted) || isNaN(paid)) return true;
        return paid <= contacted;
      });
    } else if (filter === "follow_up_due") {
      result = result.filter((r) => isFollowUpDue(r.followUpAt));
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (r) =>
          (r.fullname || "").toLowerCase().includes(query) ||
          (r.parent_name || "").toLowerCase().includes(query) ||
          (r.email || "").toLowerCase().includes(query) ||
          (r.phone_number || "").toLowerCase().includes(query)
      );
    }

    return result;
  }, [rows, filter, searchQuery]);

  const filterTabs: { key: CollectionsFilter; label: string; count: number }[] =
    [
      { key: "all", label: "All", count: counts.all },
      {
        key: "never_contacted",
        label: "Never contacted",
        count: counts.neverContacted,
      },
      {
        key: "contacted_unpaid",
        label: "Contacted, no payment",
        count: counts.contactedUnpaid,
      },
      {
        key: "follow_up_due",
        label: "Follow-up due",
        count: counts.followUpDue,
      },
    ];

  const isSelected = (userId: number) => selectedIds.includes(userId);

  const toggleRow = (userId: number) => {
    setSelectedIds((previous) =>
      previous.includes(userId)
        ? previous.filter((id) => id !== userId)
        : [...previous, userId]
    );
  };

  const allFilteredSelected =
    filteredRows.length > 0 &&
    filteredRows.every((row) => selectedIds.includes(row.userId));

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredRows.map((row) => row.userId);
    setSelectedIds((previous) =>
      allFilteredSelected
        ? previous.filter((id) => !filteredIds.includes(id))
        : Array.from(new Set([...previous, ...filteredIds]))
    );
  };

  const sendReminder = async (row: CollectionsRow) => {
    try {
      setSendingUserId(row.userId);
      const response = await fetch(
        `${API_URL}/collections/${row.userId}/send-reminder`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${savedToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        // The backend explains exactly why (e.g. email not configured) — the
        // owner needs that wording, not a generic failure.
        throw new Error(
          await readErrorMessage(response, "Could not send the reminder.")
        );
      }
      const result: SendReminderResult = await response.json();
      showToast(
        "success",
        `Reminder sent to ${result?.sentTo || row.email || "the parent"}`
      );
      await fetchCollections();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not send the reminder."
      );
    } finally {
      setSendingUserId(null);
    }
  };

  const sendBulkReminders = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsBulkSending(true);
      const response = await fetch(`${API_URL}/collections/send-reminders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${savedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: selectedIds }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Could not send the reminders.")
        );
      }
      const result: SendRemindersResult = await response.json();
      const sent = toNumber(result?.sent);
      const failed = toNumber(result?.failed);
      showToast(
        failed > 0 ? "error" : "success",
        `Sent ${sent}, failed ${failed}`
      );
      setSelectedIds([]);
      await fetchCollections();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not send the reminders."
      );
    } finally {
      setIsBulkSending(false);
    }
  };

  const fetchContactLog = useCallback(
    async (userId: number) => {
      try {
        setLogsLoading(true);
        setLogsError(null);
        const response = await fetch(
          `${API_URL}/collections/${userId}/contact-log`,
          {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error(
            await readErrorMessage(response, "Could not load the history.")
          );
        }
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching contact log:", error);
        setLogsError(
          error instanceof Error ? error.message : "Could not load the history."
        );
      } finally {
        setLogsLoading(false);
      }
    },
    [savedToken]
  );

  const openContactModal = (row: CollectionsRow) => {
    setContactRow(row);
    setLogs([]);
    setLogsError(null);
    setLogMethod("call");
    setLogNote("");
    setLogFollowUpAt("");
    setConfirmDeleteId(null);
    fetchContactLog(row.userId);
  };

  const closeContactModal = useCallback(() => {
    if (isSavingLog) return;
    setContactRow(null);
    setConfirmDeleteId(null);
  }, [isSavingLog]);

  // Escape closes the contact dialog, matching the rest of the dashboard.
  useEffect(() => {
    if (!contactRow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContactModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [contactRow, closeContactModal]);

  const saveContactLog = async () => {
    if (!contactRow) return;
    const note = logNote.trim();
    if (!note) {
      showToast("error", "Please write a short note about the contact.");
      return;
    }
    try {
      setIsSavingLog(true);
      const body: CreateContactLogDto = {
        method: logMethod,
        note,
        ...(logFollowUpAt ? { followUpAt: logFollowUpAt } : {}),
      };
      const response = await fetch(
        `${API_URL}/collections/${contactRow.userId}/contact-log`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${savedToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Could not save the note.")
        );
      }
      showToast("success", `Contact saved for ${contactRow.fullname || "player"}`);
      setLogNote("");
      setLogFollowUpAt("");
      await fetchContactLog(contactRow.userId);
      await fetchCollections();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not save the note."
      );
    } finally {
      setIsSavingLog(false);
    }
  };

  const deleteContactLog = async (logId: number) => {
    try {
      setDeletingLogId(logId);
      const response = await fetch(
        `${API_URL}/collections/contact-log/${logId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Could not delete the note.")
        );
      }
      setConfirmDeleteId(null);
      showToast("success", "Note deleted");
      if (contactRow) {
        await fetchContactLog(contactRow.userId);
      }
      await fetchCollections();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not delete the note."
      );
    } finally {
      setDeletingLogId(null);
    }
  };

  const renderRemindersCell = (row: CollectionsRow) => {
    const sent = toNumber(row.remindersSent);
    if (sent <= 0) {
      return <span className="text-gray-400">No reminders sent</span>;
    }
    const last = formatShortDate(row.lastReminderAt);
    return (
      <span className="text-gray-700">
        {sent} reminder{sent === 1 ? "" : "s"}
        {last !== "—" ? ` · last ${last}` : ""}
      </span>
    );
  };

  const renderLastContactCell = (row: CollectionsRow) => {
    if (!row.lastContactAt) {
      return (
        <span className="inline-flex items-center gap-1 text-amber-700">
          <AlertTriangle size={14} />
          Not contacted yet
        </span>
      );
    }
    return (
      <div className="max-w-[260px]">
        <div className="truncate text-gray-700" title={row.lastContactNote || ""}>
          {row.lastContactNote || "No note"}
        </div>
        <div className="text-xs text-gray-500">
          {methodLabel(row.lastContactMethod)} ·{" "}
          {formatDate(row.lastContactAt)}
          {isFollowUpDue(row.followUpAt) && (
            <span className="ml-1 text-amber-700 font-medium">
              · follow-up due
            </span>
          )}
        </div>
      </div>
    );
  };

  const summaryCards = [
    {
      label: "Total owed",
      value: formatMoney(counts.totalOwed),
      valueClass: "text-[#E43125]",
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      iconBg: "bg-red-100",
    },
    {
      label: "Families",
      value: String(counts.all),
      valueClass: "text-gray-900",
      icon: <Users className="w-5 h-5 text-blue-600" />,
      iconBg: "bg-blue-100",
    },
    {
      label: "Not contacted yet",
      value: String(counts.neverContacted),
      valueClass: "text-gray-900",
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      iconBg: "bg-amber-100",
    },
  ];

  const showEmptyState = !isLoading && !loadError && rows.length === 0;

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen rounded-lg">
      {/* Automatic-email status. Shown before anything else because sending
          reminders against half-corrected records is the costly mistake. */}
      {remindersPaused !== null && (
        <div
          className={`mb-5 rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
            remindersPaused
              ? "border-amber-300 bg-amber-50"
              : "border-green-300 bg-green-50"
          }`}
        >
          <div className="flex-1">
            <p
              className={`text-sm font-semibold ${
                remindersPaused ? "text-amber-900" : "text-green-900"
              }`}
            >
              {remindersPaused
                ? "Automatic reminder emails are PAUSED"
                : "Automatic reminder emails are ON"}
            </p>
            <p
              className={`text-xs mt-1 ${
                remindersPaused ? "text-amber-800" : "text-green-800"
              }`}
            >
              {remindersPaused
                ? "No family is emailed automatically. Sign-in codes, payment instructions and receipts still work, and you can still send a reminder by hand below. Switch this on once your member list is correct."
                : "Families are emailed automatically before their renewal date and when a payment is late."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleReminders(!remindersPaused)}
            disabled={isTogglingReminders}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 ${
              remindersPaused
                ? "bg-green-600 hover:bg-green-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {isTogglingReminders
              ? "Saving..."
              : remindersPaused
              ? "Switch reminders on"
              : "Pause reminders"}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Collections</h1>
          <p className="text-gray-500 text-sm md:text-base">
            Families with an unpaid balance
          </p>
        </div>
        <button
          onClick={() => {
            setIsLoading(true);
            fetchCollections();
          }}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}
            >
              {card.icon}
            </div>
            <div className="min-w-0">
              <div
                className={`text-2xl font-bold leading-tight truncate ${card.valueClass}`}
              >
                {isLoading ? "—" : card.value}
              </div>
              <div className="text-gray-500 text-xs md:text-sm">
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showEmptyState ? (
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center py-16 px-4 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mb-3" />
          <p className="text-gray-800 text-base md:text-lg font-medium">
            Nothing outstanding — every family is paid up.
          </p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 md:px-4 py-1.5 rounded-lg border text-sm transition-colors ${
                    filter === tab.key
                      ? "bg-[#E43125] border-[#E43125] text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  {!isLoading && (
                    <span className="ml-1.5 opacity-75">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <label htmlFor="collections-search" className="sr-only">
                Search families
              </label>
              <input
                id="collections-search"
                type="text"
                placeholder="Search name, parent, email or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full text-sm"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading collections...</span>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <XCircle className="w-10 h-10 text-red-500 mb-3" />
                <p className="text-gray-700 mb-4">{loadError}</p>
                <button
                  onClick={() => {
                    setIsLoading(true);
                    fetchCollections();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] text-sm"
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-white">
                      <tr className="border-b border-gray-200">
                        <th className="py-4 pl-4 pr-2 w-10">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            onChange={toggleSelectAllFiltered}
                            disabled={filteredRows.length === 0}
                            className="w-4 h-4 accent-[#E43125] align-middle"
                            aria-label="Select all families in this list"
                          />
                        </th>
                        <th className="text-left py-4 px-4 font-medium text-gray-600 whitespace-nowrap">
                          Player
                        </th>
                        <th className="text-left py-4 px-4 font-medium text-gray-600 whitespace-nowrap">
                          Days late
                        </th>
                        <th className="text-left py-4 px-4 font-medium text-gray-600 whitespace-nowrap">
                          Owes
                        </th>
                        <th className="text-left py-4 px-4 font-medium text-gray-600 whitespace-nowrap">
                          Reminders
                        </th>
                        <th className="text-left py-4 px-4 font-medium text-gray-600 whitespace-nowrap">
                          Last contact
                        </th>
                        <th className="text-right py-4 px-4 font-medium text-gray-600 whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length > 0 ? (
                        filteredRows.map((row) => {
                          const daysLate = toNumber(row.daysOverdue);
                          const playerName = row.fullname || "Unknown player";
                          return (
                            <tr
                              key={row.userId}
                              className={`border-b border-gray-200 ${
                                isSelected(row.userId)
                                  ? "bg-red-50"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <td className="py-4 pl-4 pr-2 align-top">
                                <input
                                  type="checkbox"
                                  checked={isSelected(row.userId)}
                                  onChange={() => toggleRow(row.userId)}
                                  className="w-4 h-4 accent-[#E43125] align-middle"
                                  aria-label={`Select ${playerName}`}
                                />
                              </td>
                              <td className="py-4 px-4 align-top">
                                <div className="font-medium text-sm md:text-base">
                                  {playerName}
                                </div>
                                <div className="text-gray-500 text-xs md:text-sm">
                                  Parent: {row.parent_name || "—"}
                                </div>
                              </td>
                              <td className="py-4 px-4 align-top whitespace-nowrap">
                                {/* A suspended-for-non-payment family can be
                                    listed before their date has passed, so
                                    "0 days late" would read as an error. */}
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                    daysLate > 0
                                      ? "bg-red-100 text-red-700"
                                      : "bg-violet-100 text-violet-700"
                                  }`}
                                >
                                  <AlertTriangle size={12} />
                                  {daysLate > 0
                                    ? `${daysLate} day${daysLate === 1 ? "" : "s"} late`
                                    : row.membershipStatus === "suspended"
                                    ? "Suspended — unpaid"
                                    : "Due today"}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  Due {formatDate(row.currentSubscriptionEndDate)}
                                </div>
                              </td>
                              <td className="py-4 px-4 align-top whitespace-nowrap font-semibold text-gray-900">
                                {formatMoney(row.amountDue)}
                              </td>
                              <td className="py-4 px-4 align-top text-sm">
                                {renderRemindersCell(row)}
                              </td>
                              <td className="py-4 px-4 align-top text-sm">
                                {renderLastContactCell(row)}
                              </td>
                              <td className="py-4 px-4 align-top">
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <button
                                      onClick={() => sendReminder(row)}
                                      disabled={sendingUserId === row.userId}
                                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] transition-colors text-sm font-medium disabled:opacity-60 whitespace-nowrap"
                                    >
                                      {sendingUserId === row.userId ? (
                                        <Loader2
                                          className="animate-spin"
                                          size={16}
                                        />
                                      ) : (
                                        <Send size={16} />
                                      )}
                                      Send reminder
                                    </button>
                                    <button
                                      onClick={() => openContactModal(row)}
                                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
                                    >
                                      <MessageSquarePlus size={16} />
                                      Log a call
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap justify-end gap-3 text-xs">
                                    {row.phone_number ? (
                                      <a
                                        href={`tel:${row.phone_number}`}
                                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                      >
                                        <Phone size={12} />
                                        {row.phone_number}
                                      </a>
                                    ) : (
                                      <span className="text-gray-400">
                                        No phone
                                      </span>
                                    )}
                                    {row.email ? (
                                      <a
                                        href={`mailto:${row.email}`}
                                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                      >
                                        <Mail size={12} />
                                        {row.email}
                                      </a>
                                    ) : (
                                      <span className="text-gray-400">
                                        No email
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-12 text-center text-gray-500"
                          >
                            No families match your filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 md:p-4 border-t border-gray-200 text-gray-500 text-xs md:text-sm">
                  Showing {filteredRows.length} of {rows.length} famil
                  {rows.length === 1 ? "y" : "ies"}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Bulk action bar — sticks to the bottom so the button is always in
          reach while scrolling a long list. */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-4 z-30 mt-4">
          <div className="bg-gray-900 text-white rounded-lg shadow-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-sm font-medium">
              {selectedIds.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                disabled={isBulkSending}
                className="px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white disabled:opacity-60"
              >
                Clear
              </button>
              <button
                onClick={sendBulkReminders}
                disabled={isBulkSending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] transition-colors text-sm font-medium disabled:opacity-60"
              >
                {isBulkSending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
                Send payment reminder to all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact modal */}
      {contactRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeContactModal}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-5 md:p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeContactModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold mb-1">Log a contact</h2>
            <p className="text-gray-500 text-sm mb-4">
              {contactRow.fullname || "Unknown player"}
              {contactRow.parent_name
                ? ` · Parent: ${contactRow.parent_name}`
                : ""}
            </p>

            <div className="space-y-4">
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-1">
                  How did you contact them?
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {METHOD_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm ${
                        logMethod === option.value
                          ? "border-[#E43125] bg-red-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="contact-method"
                        value={option.value}
                        checked={logMethod === option.value}
                        onChange={() => setLogMethod(option.value)}
                        className="accent-[#E43125]"
                      />
                      <span className="font-medium text-gray-800">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="contact-note"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  What was said?
                </label>
                <textarea
                  id="contact-note"
                  required
                  rows={3}
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="Called mum — will e-transfer Friday"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-follow-up"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Follow up on (optional)
                </label>
                <input
                  id="contact-follow-up"
                  type="date"
                  value={logFollowUpAt}
                  onChange={(e) => setLogFollowUpAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeContactModal}
                disabled={isSavingLog}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={saveContactLog}
                disabled={isSavingLog}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60 bg-[#E43125] hover:bg-[#c9281e]"
              >
                {isSavingLog && <Loader2 className="animate-spin" size={16} />}
                Save
              </button>
            </div>

            {/* History */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Contact history
              </h3>
              {logsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                  <Loader2 className="animate-spin" size={16} />
                  Loading history...
                </div>
              ) : logsError ? (
                <div className="flex flex-col items-start gap-2 text-sm">
                  <p className="text-gray-700">{logsError}</p>
                  <button
                    onClick={() => fetchContactLog(contactRow.userId)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] text-sm"
                  >
                    <RefreshCw size={14} />
                    Try again
                  </button>
                </div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No contact recorded yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {logs.map((entry) => (
                    <li
                      key={entry.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800">
                            {methodLabel(entry.method)}
                            <span className="ml-2 font-normal text-gray-500 text-xs">
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1 break-words">
                            {entry.note || "—"}
                          </p>
                          <div className="text-xs text-gray-500 mt-1">
                            by {entry.adminUsername || "system"}
                            {entry.followUpAt
                              ? ` · follow up ${formatDate(entry.followUpAt)}`
                              : ""}
                          </div>
                        </div>
                        {confirmDeleteId === entry.id ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => deleteContactLog(entry.id)}
                              disabled={deletingLogId === entry.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#E43125] text-white text-xs disabled:opacity-60"
                            >
                              {deletingLogId === entry.id && (
                                <Loader2 className="animate-spin" size={12} />
                              )}
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deletingLogId === entry.id}
                              className="px-2 py-1 rounded-lg border border-gray-200 text-gray-600 text-xs disabled:opacity-60"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(entry.id)}
                            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                            aria-label={`Delete note from ${formatDate(
                              entry.createdAt
                            )}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
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
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Collections;
