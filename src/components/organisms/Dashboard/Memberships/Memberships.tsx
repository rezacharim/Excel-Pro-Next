"use client";

import { NextPage } from "next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import {
  AlertTriangle,
  Ban,
  CalendarPlus,
  CheckCircle2,
  Download,
  Loader2,
  MoreVertical,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Upload,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import {
  ExtendDto,
  HoldDto,
  ImportResult,
  MembershipRow,
  PaymentMethod,
  RecordPaymentDto,
  StatusFilter,
} from "./types";
import { rowsToPlayers } from "./importPlayers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ModalType =
  | "record-payment"
  | "hold"
  | "resume"
  | "extend"
  | "stop"
  | "reactivate";

interface ModalState {
  type: ModalType;
  row: MembershipRow;
}

interface ToastState {
  kind: "success" | "error";
  message: string;
}

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "on_hold", label: "On hold" },
  { key: "overdue", label: "Overdue" },
  { key: "stopped", label: "Stopped" },
];

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/** New end date after recording a payment: max(today, current end) + 2 months */
const computeNewEndDate = (currentEnd: string | null): Date => {
  const today = new Date();
  let base = today;
  if (currentEnd) {
    const end = new Date(currentEnd);
    if (!isNaN(end.getTime()) && end.getTime() > today.getTime()) {
      base = end;
    }
  }
  const result = new Date(base);
  result.setMonth(result.getMonth() + 2);
  return result;
};

const Memberships: NextPage = () => {
  const [rows, setRows] = useState<MembershipRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Modal form fields
  const [paymentAmount, setPaymentAmount] = useState("380");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("etransfer");
  const [paymentNote, setPaymentNote] = useState("");
  const [holdResumeAt, setHoldResumeAt] = useState("");
  const [holdNote, setHoldNote] = useState("");
  const [extendDays, setExtendDays] = useState("30");
  const [extendNote, setExtendNote] = useState("");

  const savedToken = Cookies.get("auth_token");

  const showToast = useCallback((kind: "success" | "error", message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchOverview = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await fetch(`${API_URL}/membership/overview`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch membership overview");
      }
      const data: MembershipRow[] = await response.json();
      setRows(data);
    } catch (error) {
      console.error("Error fetching memberships:", error);
      setLoadError("Failed to load memberships. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [savedToken]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Summary counts
  const counts = useMemo(() => {
    const overdue = rows.filter((r) => r.overdue).length;
    const active = rows.filter(
      (r) => r.membershipStatus === "active" && !r.overdue
    ).length;
    const onHold = rows.filter((r) => r.membershipStatus === "on_hold").length;
    const stopped = rows.filter((r) => r.membershipStatus === "stopped").length;
    return { active, onHold, overdue, stopped };
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;

    if (statusFilter !== "all") {
      result = result.filter((r) => {
        switch (statusFilter) {
          case "overdue":
            return r.overdue;
          case "active":
            return r.membershipStatus === "active" && !r.overdue;
          case "on_hold":
            return r.membershipStatus === "on_hold";
          case "stopped":
            return r.membershipStatus === "stopped";
          default:
            return true;
        }
      });
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
  }, [rows, statusFilter, searchQuery]);

  const closeModal = () => {
    if (isSubmitting) return;
    setModal(null);
  };

  const openModal = (type: ModalType, row: MembershipRow) => {
    setOpenMenuId(null);
    // Reset form state per modal
    setPaymentAmount("380");
    setPaymentMethod("etransfer");
    setPaymentNote("");
    setHoldResumeAt("");
    setHoldNote("");
    setExtendDays("30");
    setExtendNote("");
    setModal({ type, row });
  };

  const postAction = async (
    path: string,
    body?: RecordPaymentDto | HoldDto | ExtendDto
  ): Promise<void> => {
    const response = await fetch(`${API_URL}/membership/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${savedToken}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      let message = "Request failed";
      try {
        const errorData = await response.json();
        message = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || message;
      } catch {
        // keep generic message
      }
      throw new Error(message);
    }
  };

  const runAction = async (
    path: string,
    successMessage: string,
    body?: RecordPaymentDto | HoldDto | ExtendDto
  ) => {
    try {
      setIsSubmitting(true);
      await postAction(path, body);
      setModal(null);
      showToast("success", successMessage);
      await fetchOverview();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalSubmit = async () => {
    if (!modal) return;
    const { type, row } = modal;

    switch (type) {
      case "record-payment": {
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
          showToast("error", "Please enter a valid amount");
          return;
        }
        const body: RecordPaymentDto = {
          amount,
          method: paymentMethod,
          ...(paymentNote.trim() ? { note: paymentNote.trim() } : {}),
        };
        await runAction(
          `${row.id}/record-payment`,
          `Payment recorded for ${row.fullname}`,
          body
        );
        break;
      }
      case "hold": {
        const body: HoldDto = {
          ...(holdResumeAt
            ? { resumeAt: new Date(holdResumeAt).toISOString() }
            : {}),
          ...(holdNote.trim() ? { note: holdNote.trim() } : {}),
        };
        await runAction(
          `${row.id}/hold`,
          `Membership put on hold for ${row.fullname}`,
          body
        );
        break;
      }
      case "extend": {
        const days = parseInt(extendDays, 10);
        if (isNaN(days) || days <= 0) {
          showToast("error", "Please enter a valid number of days");
          return;
        }
        const body: ExtendDto = {
          days,
          ...(extendNote.trim() ? { note: extendNote.trim() } : {}),
        };
        await runAction(
          `${row.id}/extend`,
          `Membership extended by ${days} days for ${row.fullname}`,
          body
        );
        break;
      }
      case "resume":
        await runAction(
          `${row.id}/resume`,
          `Membership resumed for ${row.fullname}`
        );
        break;
      case "stop":
        await runAction(
          `${row.id}/stop`,
          `Membership stopped for ${row.fullname}`
        );
        break;
      case "reactivate":
        await runAction(
          `${row.id}/reactivate`,
          `Membership reactivated for ${row.fullname}`
        );
        break;
    }
  };

  const exportEmails = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(
        `${API_URL}/membership/export/emails?format=csv`,
        {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to export email list");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "membership_emails.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("success", "Email list downloaded");
    } catch (error) {
      console.error("Error exporting emails:", error);
      showToast("error", "Failed to export email list. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      setIsImporting(true);
      // Dynamic import keeps the xlsx library out of the main bundle
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error("The file has no sheets");
      }
      const sheet = workbook.Sheets[firstSheetName];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: true,
        defval: "",
      });
      const players = rowsToPlayers(rows);
      if (players.length === 0) {
        throw new Error("No player rows found in the file");
      }

      const response = await fetch(`${API_URL}/membership/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${savedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ players }),
      });
      if (!response.ok) {
        let message = "Import failed";
        try {
          const errorData = await response.json();
          message = Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message || message;
        } catch {
          // keep generic message
        }
        throw new Error(message);
      }
      const result: ImportResult = await response.json();
      setImportResult(result);
      await fetchOverview();
    } catch (error) {
      console.error("Error importing members:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Failed to import file"
      );
    } finally {
      setIsImporting(false);
    }
  };

  const onImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so choosing the same file again re-triggers onChange
    event.target.value = "";
    if (file) {
      handleImportFile(file);
    }
  };

  const renderStatusBadge = (row: MembershipRow) => {
    if (row.overdue) {
      const daysOverdue =
        row.daysRemaining !== null ? Math.abs(row.daysRemaining) : null;
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertTriangle size={12} />
          {daysOverdue !== null
            ? `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`
            : "Overdue"}
        </span>
      );
    }
    switch (row.membershipStatus) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 size={12} />
            Active
          </span>
        );
      case "on_hold":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <PauseCircle size={12} />
            On hold
            {row.holdResumeAt && (
              <span className="font-normal">
                · resumes {formatDate(row.holdResumeAt)}
              </span>
            )}
          </span>
        );
      case "stopped":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
            <Ban size={12} />
            Stopped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {row.membershipStatus}
          </span>
        );
    }
  };

  const renderDaysRemaining = (row: MembershipRow) => {
    if (row.daysRemaining === null) {
      return <span className="text-gray-400">—</span>;
    }
    if (row.daysRemaining < 0) {
      return (
        <span className="text-red-600 font-medium">
          {Math.abs(row.daysRemaining)} day
          {Math.abs(row.daysRemaining) === 1 ? "" : "s"} overdue
        </span>
      );
    }
    if (row.daysRemaining <= 7) {
      return (
        <span className="text-amber-600 font-medium">
          {row.daysRemaining} day{row.daysRemaining === 1 ? "" : "s"} left
        </span>
      );
    }
    return (
      <span className="text-gray-600">
        {row.daysRemaining} day{row.daysRemaining === 1 ? "" : "s"} left
      </span>
    );
  };

  const summaryCards = [
    {
      label: "Active",
      value: counts.active,
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      iconBg: "bg-green-100",
    },
    {
      label: "On Hold",
      value: counts.onHold,
      icon: <PauseCircle className="w-5 h-5 text-amber-600" />,
      iconBg: "bg-amber-100",
    },
    {
      label: "Overdue",
      value: counts.overdue,
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      iconBg: "bg-red-100",
    },
    {
      label: "Stopped",
      value: counts.stopped,
      icon: <Ban className="w-5 h-5 text-gray-500" />,
      iconBg: "bg-gray-100",
    },
  ];

  const modalRow = modal?.row;

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen rounded-lg">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Memberships</h1>
          <p className="text-gray-500 text-sm md:text-base">
            Track player subscriptions, renewals and payments
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onImportFileChange}
            className="hidden"
            aria-label="Import members from Excel file"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-60"
          >
            {isImporting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Upload size={16} />
            )}
            Import from Excel
          </button>
          <button
            onClick={exportEmails}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] transition-colors text-sm font-medium disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Download size={16} />
            )}
            Export email list (CSV)
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
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
            <div>
              <div className="text-2xl font-bold leading-tight">
                {isLoading ? "—" : card.value}
              </div>
              <div className="text-gray-500 text-xs md:text-sm">
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 md:px-4 py-1.5 rounded-lg border text-sm transition-colors ${
                statusFilter === tab.key
                  ? "bg-[#E43125] border-[#E43125] text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.key !== "all" && !isLoading && (
                <span className="ml-1.5 opacity-75">
                  {tab.key === "active"
                    ? counts.active
                    : tab.key === "on_hold"
                    ? counts.onHold
                    : tab.key === "overdue"
                    ? counts.overdue
                    : counts.stopped}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <input
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
            <span className="ml-2">Loading memberships...</span>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <XCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-gray-700 mb-4">{loadError}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                fetchOverview();
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
              <table className="w-full min-w-full">
                <thead className="bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                      Player
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                      Plan
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                      Renewal
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                      Payments
                    </th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length > 0 ? (
                    filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        className={`border-b border-gray-200 ${
                          row.overdue
                            ? "bg-red-50 hover:bg-red-100/60"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`w-8 h-8 md:w-10 md:h-10 rounded-full mr-2 md:mr-3 flex items-center justify-center text-white ${
                                row.overdue ? "bg-[#E43125]" : "bg-blue-500"
                              }`}
                            >
                              {(row.fullname || "P").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-sm md:text-base">
                                {row.fullname || "Unknown player"}
                              </div>
                              <div className="text-gray-500 text-xs md:text-sm">
                                {row.parent_name
                                  ? `Parent: ${row.parent_name}`
                                  : row.email || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="px-2 py-1 md:px-3 rounded-full text-xs md:text-sm bg-blue-100 text-blue-800">
                            {row.activePlan || "—"}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {renderStatusBadge(row)}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-sm md:text-base text-gray-700">
                            {formatDate(row.currentSubscriptionEndDate)}
                          </div>
                          <div className="text-xs md:text-sm">
                            {renderDaysRemaining(row)}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm md:text-base text-gray-600">
                          {row.subscriptionCounter}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === row.id ? null : row.id
                                )
                              }
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                              aria-label="Row actions"
                            >
                              <MoreVertical size={18} />
                            </button>
                            {openMenuId === row.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 text-left">
                                  {row.membershipStatus !== "stopped" && (
                                    <button
                                      onClick={() =>
                                        openModal("record-payment", row)
                                      }
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <Wallet
                                        size={16}
                                        className="text-[#E43125]"
                                      />
                                      Record payment
                                    </button>
                                  )}
                                  {row.membershipStatus === "active" && (
                                    <button
                                      onClick={() => openModal("hold", row)}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <PauseCircle
                                        size={16}
                                        className="text-amber-500"
                                      />
                                      Hold
                                    </button>
                                  )}
                                  {row.membershipStatus === "on_hold" && (
                                    <button
                                      onClick={() => openModal("resume", row)}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <PlayCircle
                                        size={16}
                                        className="text-green-600"
                                      />
                                      Resume
                                    </button>
                                  )}
                                  {row.membershipStatus !== "stopped" && (
                                    <button
                                      onClick={() => openModal("extend", row)}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <CalendarPlus
                                        size={16}
                                        className="text-blue-500"
                                      />
                                      Extend
                                    </button>
                                  )}
                                  {row.membershipStatus !== "stopped" ? (
                                    <button
                                      onClick={() => openModal("stop", row)}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                                    >
                                      <Ban size={16} />
                                      Stop
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        openModal("reactivate", row)
                                      }
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <RotateCcw
                                        size={16}
                                        className="text-green-600"
                                      />
                                      Reactivate
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        {rows.length === 0
                          ? "No memberships found"
                          : "No memberships match your filters"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 md:p-4 border-t border-gray-200 text-gray-500 text-xs md:text-sm">
              Showing {filteredRows.length} of {rows.length} memberships
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {modal && modalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-5 md:p-6">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {modal.type === "record-payment" && (
              <>
                <h2 className="text-lg font-bold mb-1">Record payment</h2>
                <p className="text-gray-500 text-sm mb-4">
                  {modalRow.fullname}
                  {modalRow.parent_name ? ` · Parent: ${modalRow.parent_name}` : ""}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as PaymentMethod)
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="etransfer">E-transfer</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="e.g. reference number"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
                    New end date:{" "}
                    <span className="font-medium">
                      {computeNewEndDate(
                        modalRow.currentSubscriptionEndDate
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>{" "}
                    <span className="text-gray-500">(+2 months)</span>
                  </div>
                </div>
              </>
            )}

            {modal.type === "hold" && (
              <>
                <h2 className="text-lg font-bold mb-1">Hold membership</h2>
                <p className="text-gray-500 text-sm mb-4">{modalRow.fullname}</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resume date (optional)
                    </label>
                    <input
                      type="date"
                      value={holdResumeAt}
                      onChange={(e) => setHoldResumeAt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      value={holdNote}
                      onChange={(e) => setHoldNote(e.target.value)}
                      placeholder="e.g. injury, vacation"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                    Held time is credited back on resume — the remaining days of
                    the subscription are preserved.
                  </div>
                </div>
              </>
            )}

            {modal.type === "extend" && (
              <>
                <h2 className="text-lg font-bold mb-1">Extend membership</h2>
                <p className="text-gray-500 text-sm mb-4">{modalRow.fullname}</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Days to add
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={extendDays}
                      onChange={(e) => setExtendDays(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      value={extendNote}
                      onChange={(e) => setExtendNote(e.target.value)}
                      placeholder="Reason for extension"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {modal.type === "resume" && (
              <>
                <h2 className="text-lg font-bold mb-2">Resume membership</h2>
                <p className="text-gray-600 text-sm mb-1">
                  Resume the membership for{" "}
                  <span className="font-medium">{modalRow.fullname}</span>?
                </p>
                <p className="text-gray-500 text-sm">
                  The time held will be credited back to the subscription.
                </p>
              </>
            )}

            {modal.type === "stop" && (
              <>
                <h2 className="text-lg font-bold mb-2">Stop membership</h2>
                <p className="text-gray-600 text-sm">
                  Are you sure you want to stop the membership for{" "}
                  <span className="font-medium">{modalRow.fullname}</span>? You
                  can reactivate it later.
                </p>
              </>
            )}

            {modal.type === "reactivate" && (
              <>
                <h2 className="text-lg font-bold mb-2">Reactivate membership</h2>
                <p className="text-gray-600 text-sm">
                  Reactivate the membership for{" "}
                  <span className="font-medium">{modalRow.fullname}</span>?
                </p>
              </>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60 bg-[#E43125] hover:bg-[#c9281e]"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                {modal.type === "record-payment"
                  ? "Record payment"
                  : modal.type === "hold"
                  ? "Put on hold"
                  : modal.type === "extend"
                  ? "Extend"
                  : modal.type === "resume"
                  ? "Resume"
                  : modal.type === "stop"
                  ? "Stop membership"
                  : "Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import result modal */}
      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setImportResult(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-5 md:p-6 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setImportResult(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="text-green-600" size={20} />
              <h2 className="text-lg font-bold">
                {importResult.created} member
                {importResult.created === 1 ? "" : "s"} imported
              </h2>
            </div>
            {importResult.skipped.length > 0 ? (
              <>
                <p className="text-gray-500 text-sm mb-3">
                  {importResult.skipped.length} row
                  {importResult.skipped.length === 1 ? " was" : "s were"}{" "}
                  skipped:
                </p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200 text-left">
                        <th className="py-2 px-3 font-medium text-gray-600">
                          Row
                        </th>
                        <th className="py-2 px-3 font-medium text-gray-600">
                          Player
                        </th>
                        <th className="py-2 px-3 font-medium text-gray-600">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.skipped.map((skippedRow, i) => (
                        <tr
                          key={`${skippedRow.index}-${i}`}
                          className="border-b border-gray-100 last:border-b-0"
                        >
                          <td className="py-2 px-3 text-gray-600">
                            {skippedRow.index}
                          </td>
                          <td className="py-2 px-3">
                            {skippedRow.fullname || "—"}
                          </td>
                          <td className="py-2 px-3 text-red-600">
                            {skippedRow.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">
                All rows were imported successfully.
              </p>
            )}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setImportResult(null)}
                className="px-4 py-2 rounded-lg bg-[#E43125] hover:bg-[#c9281e] text-white text-sm font-medium"
              >
                Done
              </button>
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

export default Memberships;
