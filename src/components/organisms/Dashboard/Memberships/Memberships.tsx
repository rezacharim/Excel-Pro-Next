"use client";

import { NextPage } from "next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import {
  AlertTriangle,
  Ban,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Mail,
  MoreVertical,
  PauseCircle,
  Phone,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import {
  ATTENDANCE_STATUSES,
  AttendanceFilter,
  AttendanceStatus,
  ContactLogEntry,
  ExtendDto,
  ImportResult,
  HoldDto,
  MembershipRow,
  PaymentMethod,
  ProgramFilter,
  RecordPaymentDto,
  SendReminderResult,
  SortDirection,
  SortKey,
  StatusFilter,
  SuspendDto,
  SuspensionReason,
  UpdateNotesDto,
} from "./types";
import { rowsToPlayers } from "./importPlayers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ModalType =
  | "record-payment"
  | "hold"
  | "resume"
  | "extend"
  | "stop"
  | "reactivate"
  | "set-plan"
  | "suspend"
  | "unsuspend";

/** The four real programs a player can belong to. */
export const PLAN_OPTIONS = [
  { value: "U5_U8", label: "U5–U8" },
  { value: "U9_U12", label: "U9–U12" },
  { value: "U13_U14", label: "U13–U14" },
  { value: "U15_U18", label: "U15–U18" },
] as const;

/**
 * Friendly name for a stored plan value. Players who signed up without
 * choosing a program first were saved with a placeholder ("free"/"freePlane"),
 * which should read as "Not set" so it's obvious it needs fixing.
 */
const planLabel = (plan?: string | null): string => {
  if (!plan) return "Not set";
  const match = PLAN_OPTIONS.find((p) => p.value === plan);
  if (match) return match.label;
  const normalized = plan.toLowerCase();
  if (normalized.includes("free") || normalized === "none") return "Not set";
  return plan;
};

const isPlanSet = (plan?: string | null): boolean =>
  planLabel(plan) !== "Not set";

const SUSPENSION_REASON_OPTIONS: {
  value: SuspensionReason;
  label: string;
  hint: string;
}[] = [
  {
    value: "late_payment",
    label: "Late payment",
    hint: "Fees are overdue and the family has not arranged anything.",
  },
  {
    value: "discipline",
    label: "Discipline",
    hint: "Behaviour on or off the pitch.",
  },
  {
    value: "paperwork",
    label: "Paperwork",
    hint: "Missing registration, waiver or medical form.",
  },
  {
    value: "medical",
    label: "Medical",
    hint: "Injury or health reason keeping the player out.",
  },
  { value: "other", label: "Other", hint: "Anything else — explain in the note." },
];

const suspensionReasonLabel = (reason?: string | null): string => {
  if (!reason) return "No reason given";
  const match = SUSPENSION_REASON_OPTIONS.find((r) => r.value === reason);
  return match ? match.label : "Other";
};

/**
 * Payment and paperwork suspensions are administrative, so the parent should
 * hear immediately. Discipline and medical ones are sensitive — the academy
 * phones first, so the email stays off unless the admin ticks it.
 */
const DEFAULT_NOTIFY_PARENT: Record<SuspensionReason, boolean> = {
  late_payment: true,
  paperwork: true,
  discipline: false,
  medical: false,
  other: false,
};

const ATTENDANCE_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  dotClass: string;
  title: string;
}[] = [
  {
    value: "attending",
    label: "Attending",
    dotClass: "bg-green-500",
    title: "Attending regularly",
  },
  {
    value: "irregular",
    label: "Irregular",
    dotClass: "bg-amber-500",
    title: "Attending irregularly",
  },
  {
    value: "not_attending",
    label: "Not attending",
    dotClass: "bg-gray-400",
    title: "Not attending",
  },
];

const isAttendanceStatus = (value: string): value is AttendanceStatus =>
  (ATTENDANCE_STATUSES as readonly string[]).includes(value);

/** The API may send an empty or unknown value; treat those as "attending". */
const attendanceOf = (row: MembershipRow): AttendanceStatus =>
  isAttendanceStatus(row.attendanceStatus ?? "")
    ? (row.attendanceStatus as AttendanceStatus)
    : "attending";

const PROGRAM_FILTER_OPTIONS: { value: ProgramFilter; label: string }[] = [
  { value: "all", label: "All programs" },
  ...PLAN_OPTIONS.map((plan) => ({
    value: plan.value as ProgramFilter,
    label: plan.label,
  })),
  { value: "not_set", label: "Not set" },
];

const ATTENDANCE_FILTER_OPTIONS: { value: AttendanceFilter; label: string }[] = [
  { value: "all", label: "All attendance" },
  ...ATTENDANCE_OPTIONS.map((option) => ({
    value: option.value as AttendanceFilter,
    label: option.label,
  })),
];

const SESSION_EXPIRED = "Your session expired — please sign in again.";

const toNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return isFinite(parsed) ? parsed : 0;
};

/**
 * Readable name for a contact-log method. The backend also writes
 * "reminder_email" rows by itself when a reminder goes out.
 */
const contactMethodLabel = (method?: string | null): string => {
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
      return method || "Contact";
  }
};

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

const MODAL_SUBMIT_LABEL: Record<ModalType, string> = {
  "record-payment": "Record payment",
  hold: "Put on hold",
  resume: "Resume",
  extend: "Extend",
  stop: "Stop membership",
  reactivate: "Reactivate",
  "set-plan": "Save program",
  suspend: "Suspend account",
  unsuspend: "Lift suspension",
};

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
  { key: "suspended", label: "Suspended" },
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

/** Compact form ("Aug 10") for inline mentions inside a sentence. */
const formatShortDate = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/** Whole years old, or null when the date of birth is missing or nonsense. */
const calculateAge = (iso: string | null): number | null => {
  if (!iso) return null;
  const dob = new Date(iso);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  if (age < 0 || age > 120) return null;
  return age;
};

/** A suspended player is not "active", whatever their renewal date says. */
const isSuspended = (row: MembershipRow): boolean =>
  row.membershipStatus === "suspended";

/** Overdue is a payment state; suspended accounts are counted on their own. */
const isCountedOverdue = (row: MembershipRow): boolean =>
  row.overdue && !isSuspended(row);

/** Most urgent first, so ascending status order reads as a worklist. */
const statusRank = (row: MembershipRow): number => {
  if (isCountedOverdue(row)) return 0;
  if (isSuspended(row)) return 1;
  if (row.membershipStatus === "on_hold") return 2;
  if (row.membershipStatus === "active") return 3;
  return 4;
};

const planRank = (plan: string | null): number => {
  const index = PLAN_OPTIONS.findIndex((option) => option.value === plan);
  return index === -1 ? PLAN_OPTIONS.length : index;
};

/** Missing renewal dates always sort last, whichever way the column points. */
const renewalTime = (iso: string | null): number | null => {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  return isNaN(time) ? null : time;
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
  const [programFilter, setProgramFilter] = useState<ProgramFilter>("all");
  const [attendanceFilter, setAttendanceFilter] =
    useState<AttendanceFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
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
  const [selectedPlan, setSelectedPlan] = useState<string>("U9_U12");
  const [suspendReason, setSuspendReason] =
    useState<SuspensionReason>("late_payment");
  const [suspendNote, setSuspendNote] = useState("");
  const [notifyParent, setNotifyParent] = useState(
    DEFAULT_NOTIFY_PARENT.late_payment
  );

  // Player detail drawer. Held by id, not by value, so the panel shows the
  // freshly fetched row after any change instead of a stale snapshot.
  const [detailId, setDetailId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [attendanceDraft, setAttendanceDraft] =
    useState<AttendanceStatus>("attending");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [contactLogs, setContactLogs] = useState<ContactLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  // Where to draw the open row menu. Positioned in fixed coordinates so it is
  // never clipped by the table's scroll container (it used to be cut off for
  // the last rows, making the actions unreachable).
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null
  );
  const menuAnchorRef = useRef<HTMLElement | null>(null);

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

  // Summary counts. Suspended players are their own bucket, so they are kept
  // out of "active" and "overdue" — otherwise the same player is counted twice
  // and the owner cannot trust either number.
  const counts = useMemo(() => {
    const overdue = rows.filter(isCountedOverdue).length;
    const active = rows.filter(
      (r) => r.membershipStatus === "active" && !r.overdue
    ).length;
    const onHold = rows.filter((r) => r.membershipStatus === "on_hold").length;
    const suspended = rows.filter(isSuspended).length;
    const stopped = rows.filter((r) => r.membershipStatus === "stopped").length;
    return { active, onHold, overdue, suspended, stopped };
  }, [rows]);

  const countForTab = (key: StatusFilter): number => {
    switch (key) {
      case "active":
        return counts.active;
      case "on_hold":
        return counts.onHold;
      case "overdue":
        return counts.overdue;
      case "suspended":
        return counts.suspended;
      case "stopped":
        return counts.stopped;
      default:
        return rows.length;
    }
  };

  const filteredRows = useMemo(() => {
    let result = rows;

    if (statusFilter !== "all") {
      result = result.filter((r) => {
        switch (statusFilter) {
          case "overdue":
            return isCountedOverdue(r);
          case "active":
            return r.membershipStatus === "active" && !r.overdue;
          case "on_hold":
            return r.membershipStatus === "on_hold";
          case "suspended":
            return isSuspended(r);
          case "stopped":
            return r.membershipStatus === "stopped";
          default:
            return true;
        }
      });
    }

    if (programFilter !== "all") {
      result = result.filter((r) =>
        programFilter === "not_set"
          ? !isPlanSet(r.activePlan)
          : r.activePlan === programFilter
      );
    }

    if (attendanceFilter !== "all") {
      result = result.filter((r) => attendanceOf(r) === attendanceFilter);
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

    if (sortKey === "default") return result;

    const factor = sortDirection === "asc" ? 1 : -1;
    // Sort a copy: `result` can still be the state array when no filter ran.
    return [...result].sort((a, b) => {
      switch (sortKey) {
        case "player":
          return (
            factor * (a.fullname || "").localeCompare(b.fullname || "", "en")
          );
        case "plan":
          return factor * (planRank(a.activePlan) - planRank(b.activePlan));
        case "status":
          return factor * (statusRank(a) - statusRank(b));
        case "renewal": {
          const left = renewalTime(a.currentSubscriptionEndDate);
          const right = renewalTime(b.currentSubscriptionEndDate);
          if (left === null && right === null) return 0;
          if (left === null) return 1;
          if (right === null) return -1;
          return factor * (left - right);
        }
        case "payments":
          return (
            factor *
            (toNumber(a.subscriptionCounter) - toNumber(b.subscriptionCounter))
          );
        default:
          return 0;
      }
    });
  }, [
    rows,
    statusFilter,
    programFilter,
    attendanceFilter,
    searchQuery,
    sortKey,
    sortDirection,
  ]);

  /** asc → desc → back to the server's default ordering. */
  const toggleSort = (key: Exclude<SortKey, "default">) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
      return;
    }
    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }
    setSortKey("default");
    setSortDirection("asc");
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModal(null);
  };

  const openModal = (type: ModalType, row: MembershipRow) => {
    setOpenMenuId(null);
    setMenuPos(null);
    // Reset form state per modal
    setPaymentAmount("380");
    setPaymentMethod("etransfer");
    setPaymentNote("");
    setHoldResumeAt("");
    setHoldNote("");
    setExtendDays("30");
    setExtendNote("");
    setSelectedPlan(
      PLAN_OPTIONS.some((p) => p.value === row.activePlan)
        ? row.activePlan
        : "U9_U12"
    );
    setSuspendReason("late_payment");
    setSuspendNote("");
    setNotifyParent(DEFAULT_NOTIFY_PARENT.late_payment);
    setModal({ type, row });
  };

  /** Picking a reason re-applies that reason's notification default. */
  const chooseSuspendReason = (reason: SuspensionReason) => {
    setSuspendReason(reason);
    setNotifyParent(DEFAULT_NOTIFY_PARENT[reason]);
  };

  /** Work out where the menu should sit, given its trigger button. */
  const positionFor = (button: HTMLElement) => {
    const rect = button.getBoundingClientRect();
    const MENU_HEIGHT = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < MENU_HEIGHT && rect.top > spaceBelow;
    const top = openUpwards
      ? Math.max(8, rect.top - MENU_HEIGHT - 4)
      : Math.min(rect.bottom + 4, window.innerHeight - MENU_HEIGHT - 8);
    return {
      top: Math.max(8, top),
      right: Math.max(8, window.innerWidth - rect.right),
    };
  };

  /** Open the row menu anchored to its button, in viewport coordinates. */
  const toggleRowMenu = (
    rowId: number,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (openMenuId === rowId) {
      setOpenMenuId(null);
      setMenuPos(null);
      return;
    }
    menuAnchorRef.current = event.currentTarget;
    setMenuPos(positionFor(event.currentTarget));
    setOpenMenuId(rowId);
  };

  const closeRowMenu = useCallback(() => {
    setOpenMenuId(null);
    setMenuPos(null);
    menuAnchorRef.current = null;
  }, []);

  // Keep the menu glued to its row while the page scrolls or resizes, and
  // close it only once the row itself has scrolled out of sight.
  useEffect(() => {
    if (openMenuId === null) return;
    const reposition = () => {
      const anchor = menuAnchorRef.current;
      if (!anchor || !anchor.isConnected) {
        closeRowMenu();
        return;
      }
      const rect = anchor.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        closeRowMenu();
        return;
      }
      setMenuPos(positionFor(anchor));
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [openMenuId, closeRowMenu]);

  const postAction = async (
    path: string,
    body?: RecordPaymentDto | HoldDto | ExtendDto | { plan: string } | SuspendDto
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
    body?: RecordPaymentDto | HoldDto | ExtendDto | { plan: string } | SuspendDto
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
      case "set-plan":
        await runAction(
          `${row.id}/set-plan`,
          `${row.fullname} moved to ${planLabel(selectedPlan)}`,
          { plan: selectedPlan }
        );
        break;
      case "suspend": {
        const body: SuspendDto = {
          reason: suspendReason,
          notifyParent,
          ...(suspendNote.trim() ? { note: suspendNote.trim() } : {}),
        };
        await runAction(
          `${row.id}/suspend`,
          `${row.fullname || "Player"} suspended — ${suspensionReasonLabel(
            suspendReason
          ).toLowerCase()}`,
          body
        );
        break;
      }
      case "unsuspend":
        await runAction(
          `${row.id}/unsuspend`,
          `Suspension lifted for ${row.fullname || "player"}`
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
            await readErrorMessage(
              response,
              "Could not load contact history"
            )
          );
        }
        const data = await response.json();
        setContactLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching contact log:", error);
        // A missing history must never blank the rest of the panel.
        setContactLogs([]);
        setLogsError(
          error instanceof Error ? error.message : "Could not load contact history"
        );
      } finally {
        setLogsLoading(false);
      }
    },
    [savedToken]
  );

  const openDetail = (row: MembershipRow) => {
    closeRowMenu();
    setDetailId(row.id);
    setNoteDraft(row.internalNote || "");
    setAttendanceDraft(attendanceOf(row));
    setContactLogs([]);
    setLogsError(null);
    fetchContactLog(row.id);
  };

  const closeDetail = useCallback(() => {
    setDetailId(null);
    setContactLogs([]);
    setLogsError(null);
  }, []);

  // Escape closes the drawer, unless a modal is stacked on top of it.
  useEffect(() => {
    if (detailId === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !modal) closeDetail();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailId, modal, closeDetail]);

  const saveNotes = async (row: MembershipRow) => {
    try {
      setIsSavingNotes(true);
      const body: UpdateNotesDto = {
        internalNote: noteDraft.trim(),
        attendanceStatus: attendanceDraft,
      };
      const response = await fetch(`${API_URL}/membership/${row.id}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${savedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Could not save the notes.")
        );
      }
      showToast("success", `Notes saved for ${row.fullname || "player"}`);
      await fetchOverview();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not save the notes."
      );
    } finally {
      setIsSavingNotes(false);
    }
  };

  const sendPaymentReminder = async (row: MembershipRow) => {
    try {
      setIsSendingReminder(true);
      const response = await fetch(
        `${API_URL}/collections/${row.id}/send-reminder`,
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
      await Promise.all([fetchOverview(), fetchContactLog(row.id)]);
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not send the reminder."
      );
    } finally {
      setIsSendingReminder(false);
    }
  };

  const renderAttendanceDot = (row: MembershipRow) => {
    const status = attendanceOf(row);
    const option =
      ATTENDANCE_OPTIONS.find((item) => item.value === status) ??
      ATTENDANCE_OPTIONS[0];
    return (
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${option.dotClass}`}
        title={`Attendance: ${option.title}`}
        aria-label={`Attendance: ${option.title}`}
        role="img"
      />
    );
  };

  /** "2 reminders · last Aug 10", or nothing when none have been sent. */
  const renderReminderLine = (row: MembershipRow) => {
    const sent = toNumber(row.remindersSent);
    if (sent <= 0) return null;
    const last = formatShortDate(row.lastReminderAt);
    return (
      <div className="text-xs text-gray-500">
        {sent} reminder{sent === 1 ? "" : "s"}
        {last ? ` · last ${last}` : ""}
      </div>
    );
  };

  const renderStatusBadge = (row: MembershipRow) => {
    // Checked before "overdue": a suspended account is usually behind on fees
    // too, and the suspension is the fact the staff must act on.
    if (isSuspended(row)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
          <ShieldAlert size={12} />
          Suspended
          <span className="font-normal">
            · {suspensionReasonLabel(row.suspensionReason)}
          </span>
        </span>
      );
    }
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
      label: "Suspended",
      value: counts.suspended,
      icon: <ShieldAlert className="w-5 h-5 text-violet-600" />,
      iconBg: "bg-violet-100",
    },
    {
      label: "Stopped",
      value: counts.stopped,
      icon: <Ban className="w-5 h-5 text-gray-500" />,
      iconBg: "bg-gray-100",
    },
  ];

  const modalRow = modal?.row;
  const menuRow =
    openMenuId === null ? null : rows.find((r) => r.id === openMenuId) ?? null;
  const detailRow =
    detailId === null ? null : rows.find((r) => r.id === detailId) ?? null;
  const detailAge = detailRow ? calculateAge(detailRow.dateOfBirth) : null;

  // Newest first, tolerating entries the API sent without a usable date.
  const sortedContactLogs = useMemo(
    () =>
      [...contactLogs].sort((a, b) => {
        const left = new Date(a.createdAt).getTime();
        const right = new Date(b.createdAt).getTime();
        if (isNaN(left) && isNaN(right)) return 0;
        if (isNaN(left)) return 1;
        if (isNaN(right)) return -1;
        return right - left;
      }),
    [contactLogs]
  );

  const renderSortIcon = (key: Exclude<SortKey, "default">) => {
    if (sortKey !== key) return null;
    return sortDirection === "asc" ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  const sortableHeader = (key: Exclude<SortKey, "default">, label: string) => (
    <th
      className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap"
      aria-sort={
        sortKey === key
          ? sortDirection === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <button
        onClick={() => toggleSort(key)}
        className={`inline-flex items-center gap-1 hover:text-gray-900 transition-colors ${
          sortKey === key ? "text-gray-900" : ""
        }`}
        title={`Sort by ${label.toLowerCase()}`}
      >
        {label}
        {renderSortIcon(key)}
      </button>
    </th>
  );

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
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
                <span className="ml-1.5 opacity-75">{countForTab(tab.key)}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <label htmlFor="memberships-search" className="sr-only">
            Search memberships
          </label>
          <input
            id="memberships-search"
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

      {/* Program / attendance filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="program-filter"
            className="text-sm text-gray-600 whitespace-nowrap"
          >
            Program
          </label>
          <select
            id="program-filter"
            value={programFilter}
            onChange={(e) =>
              setProgramFilter(e.target.value as ProgramFilter)
            }
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            {PROGRAM_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="attendance-filter"
            className="text-sm text-gray-600 whitespace-nowrap"
          >
            Attendance
          </label>
          <select
            id="attendance-filter"
            value={attendanceFilter}
            onChange={(e) =>
              setAttendanceFilter(e.target.value as AttendanceFilter)
            }
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            {ATTENDANCE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {sortKey !== "default" && (
          <button
            onClick={() => {
              setSortKey("default");
              setSortDirection("asc");
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            Default order
          </button>
        )}
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
                    {sortableHeader("player", "Player")}
                    {sortableHeader("plan", "Plan")}
                    {sortableHeader("status", "Status")}
                    {sortableHeader("renewal", "Renewal")}
                    {sortableHeader("payments", "Payments")}
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
                              <div className="flex items-center gap-2">
                                {renderAttendanceDot(row)}
                                <button
                                  onClick={() => openDetail(row)}
                                  className="font-medium text-sm md:text-base text-left text-gray-900 hover:text-[#E43125] hover:underline"
                                  aria-label={`Open details for ${
                                    row.fullname || "player"
                                  }`}
                                >
                                  {row.fullname || "Unknown player"}
                                </button>
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
                          {isPlanSet(row.activePlan) ? (
                            <span className="px-2 py-1 md:px-3 rounded-full text-xs md:text-sm bg-blue-100 text-blue-800">
                              {planLabel(row.activePlan)}
                            </span>
                          ) : (
                            <button
                              onClick={() => openModal("set-plan", row)}
                              title="This player has no program yet — click to set one"
                              className="px-2 py-1 md:px-3 rounded-full text-xs md:text-sm bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                            >
                              Not set — choose
                            </button>
                          )}
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
                          <div>
                            {toNumber(row.subscriptionCounter)} payment
                            {toNumber(row.subscriptionCounter) === 1 ? "" : "s"}
                          </div>
                          {renderReminderLine(row)}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <button
                            onClick={(e) => toggleRowMenu(row.id, e)}
                            className={`p-2 rounded-lg text-gray-500 hover:bg-gray-100 ${
                              openMenuId === row.id ? "bg-gray-100" : ""
                            }`}
                            aria-label={`Actions for ${row.fullname}`}
                            aria-haspopup="menu"
                            aria-expanded={openMenuId === row.id}
                          >
                            <MoreVertical size={18} />
                          </button>
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

      {/* Row actions menu — rendered outside the table so it can never be
          clipped by the table's scroll area (previously the actions for the
          last rows were cut off and unclickable). */}
      {openMenuId !== null && menuPos && menuRow && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeRowMenu} />
          <div
            role="menu"
            style={{ top: menuPos.top, right: menuPos.right }}
            className="fixed w-52 max-h-[80vh] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 text-left"
          >
            {menuRow.membershipStatus !== "stopped" && (
              <button
                onClick={() => openModal("record-payment", menuRow)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Wallet size={16} className="text-[#E43125]" />
                Record payment
              </button>
            )}
            <button
              onClick={() => openModal("set-plan", menuRow)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Users size={16} className="text-indigo-500" />
              Change program
            </button>
            {menuRow.membershipStatus === "active" && (
              <button
                onClick={() => openModal("hold", menuRow)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <PauseCircle size={16} className="text-amber-500" />
                Hold
              </button>
            )}
            {menuRow.membershipStatus === "on_hold" && (
              <button
                onClick={() => openModal("resume", menuRow)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <PlayCircle size={16} className="text-green-600" />
                Resume
              </button>
            )}
            {menuRow.membershipStatus !== "stopped" && (
              <button
                onClick={() => openModal("extend", menuRow)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <CalendarPlus size={16} className="text-blue-500" />
                Extend
              </button>
            )}
            {menuRow.membershipStatus === "suspended" ? (
              <button
                onClick={() => openModal("unsuspend", menuRow)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
              >
                <ShieldCheck size={16} className="text-green-600" />
                Lift suspension
              </button>
            ) : (
              menuRow.membershipStatus !== "stopped" && (
                <button
                  onClick={() => openModal("suspend", menuRow)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
                >
                  <ShieldAlert size={16} className="text-amber-600" />
                  Suspend account
                </button>
              )
            )}
            {menuRow.membershipStatus !== "stopped" ? (
              <button
                onClick={() => openModal("stop", menuRow)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
              >
                <Ban size={16} />
                Stop
              </button>
            ) : (
              <button
                onClick={() => openModal("reactivate", menuRow)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw size={16} className="text-green-600" />
                Reactivate
              </button>
            )}
          </div>
        </>
      )}

      {/* Player detail drawer */}
      {detailRow && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeDetail}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${detailRow.fullname || "player"}`}
            className="fixed top-0 right-0 h-full w-[440px] max-w-[100vw] bg-white shadow-2xl z-40 flex flex-col"
          >
            <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-200">
              <div className="min-w-0">
                <h2 className="text-lg font-bold break-words">
                  {detailRow.fullname || "Unknown player"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {detailAge !== null && (
                    <span className="text-sm text-gray-500">
                      {detailAge} year{detailAge === 1 ? "" : "s"} old
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs ${
                      isPlanSet(detailRow.activePlan)
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {planLabel(detailRow.activePlan)}
                  </span>
                  {renderStatusBadge(detailRow)}
                </div>
              </div>
              <button
                onClick={closeDetail}
                className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Close player details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Contact */}
              <section>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Contact
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Parent</dt>
                    <dd className="text-gray-800 text-right break-words">
                      {detailRow.parent_name || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="text-right">
                      {detailRow.phone_number ? (
                        <a
                          href={`tel:${detailRow.phone_number}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline break-all"
                        >
                          <Phone size={14} />
                          {detailRow.phone_number}
                        </a>
                      ) : (
                        <span className="text-gray-400">No phone</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="text-right">
                      {detailRow.email ? (
                        <a
                          href={`mailto:${detailRow.email}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline break-all"
                        >
                          <Mail size={14} />
                          {detailRow.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">No email</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Membership */}
              <section>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Membership
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Renewal</dt>
                    <dd className="text-gray-800">
                      {formatDate(detailRow.currentSubscriptionEndDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Time left</dt>
                    <dd>{renderDaysRemaining(detailRow)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Payments</dt>
                    <dd className="text-gray-800">
                      {toNumber(detailRow.subscriptionCounter)} payment
                      {toNumber(detailRow.subscriptionCounter) === 1 ? "" : "s"}
                    </dd>
                  </div>
                </dl>
                {isSuspended(detailRow) && (
                  <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-900">
                    <div className="font-medium">
                      Suspended · {suspensionReasonLabel(
                        detailRow.suspensionReason
                      )}
                    </div>
                    {formatDate(detailRow.suspendedAt) !== "—" && (
                      <div className="text-xs text-violet-700 mt-0.5">
                        Since {formatDate(detailRow.suspendedAt)}
                      </div>
                    )}
                    {detailRow.suspensionNote && (
                      <p className="mt-1 break-words">
                        {detailRow.suspensionNote}
                      </p>
                    )}
                  </div>
                )}
                {detailRow.overdue && (
                  <button
                    onClick={() => sendPaymentReminder(detailRow)}
                    disabled={isSendingReminder}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] transition-colors text-sm font-medium disabled:opacity-60"
                  >
                    {isSendingReminder ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                    Send payment reminder
                  </button>
                )}
              </section>

              {/* Notes & attendance */}
              <section>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Notes &amp; attendance
                </h3>
                <label
                  htmlFor="player-internal-note"
                  className="block text-sm text-gray-600 mb-1"
                >
                  Internal note
                </label>
                <textarea
                  id="player-internal-note"
                  rows={3}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Anything the staff should know"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only you and your staff see this.
                </p>

                <fieldset className="mt-4">
                  <legend className="block text-sm text-gray-600 mb-1">
                    Attendance
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {ATTENDANCE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setAttendanceDraft(option.value)}
                        aria-pressed={attendanceDraft === option.value}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                          attendanceDraft === option.value
                            ? "border-[#E43125] bg-red-50 text-gray-900"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${option.dotClass}`}
                        />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <button
                  onClick={() => saveNotes(detailRow)}
                  disabled={isSavingNotes}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E43125] hover:bg-[#c9281e] text-white text-sm font-medium disabled:opacity-60"
                >
                  {isSavingNotes && (
                    <Loader2 className="animate-spin" size={16} />
                  )}
                  Save notes
                </button>
              </section>

              {/* Contact history */}
              <section>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Contact history
                </h3>
                {logsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="animate-spin" size={16} />
                    Loading history...
                  </div>
                ) : logsError ? (
                  <div className="flex flex-col items-start gap-2 text-sm">
                    <p className="text-gray-700">Could not load contact history</p>
                    <button
                      onClick={() => fetchContactLog(detailRow.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] text-sm"
                    >
                      <RefreshCw size={14} />
                      Try again
                    </button>
                  </div>
                ) : contactLogs.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No calls or emails logged yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {sortedContactLogs.map((entry) => (
                      <li
                        key={entry.id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="text-sm font-medium text-gray-800">
                          {contactMethodLabel(entry.method)}
                          <span className="ml-2 font-normal text-gray-500 text-xs">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 break-words">
                          {entry.note || "—"}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                          by {entry.adminUsername || "system"}
                          {formatDate(entry.followUpAt) !== "—"
                            ? ` · follow up ${formatDate(entry.followUpAt)}`
                            : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </aside>
        </>
      )}

      {/* Modals */}
      {modal && modalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-5 md:p-6 max-h-[90vh] overflow-y-auto">
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

            {modal.type === "set-plan" && (
              <>
                <h2 className="text-lg font-bold mb-2">Change program</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Choose the program for{" "}
                  <span className="font-medium">{modalRow.fullname}</span>.
                  Current: {planLabel(modalRow.activePlan)}
                </p>
                <div className="space-y-2">
                  {PLAN_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer text-sm ${
                        selectedPlan === option.value
                          ? "border-[#E43125] bg-red-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="program"
                        value={option.value}
                        checked={selectedPlan === option.value}
                        onChange={() => setSelectedPlan(option.value)}
                        className="accent-[#E43125]"
                      />
                      <span className="font-medium text-gray-800">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {modal.type === "suspend" && (
              <>
                <h2 className="text-lg font-bold mb-1">Suspend account</h2>
                <p className="text-gray-500 text-sm mb-4">
                  {modalRow.fullname || "Unknown player"}
                  {modalRow.parent_name
                    ? ` · Parent: ${modalRow.parent_name}`
                    : ""}
                </p>
                <div className="space-y-4">
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-1">
                      Why are you suspending this account?
                    </legend>
                    <div className="space-y-2">
                      {SUSPENSION_REASON_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-start gap-3 px-3 py-2 border rounded-lg cursor-pointer text-sm ${
                            suspendReason === option.value
                              ? "border-[#E43125] bg-red-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="suspension-reason"
                            value={option.value}
                            checked={suspendReason === option.value}
                            onChange={() => chooseSuspendReason(option.value)}
                            className="accent-[#E43125] mt-0.5"
                          />
                          <span>
                            <span className="font-medium text-gray-800 block">
                              {option.label}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {option.hint}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div>
                    <label
                      htmlFor="suspend-note"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Internal note (optional)
                    </label>
                    <textarea
                      id="suspend-note"
                      rows={3}
                      value={suspendNote}
                      onChange={(e) => setSuspendNote(e.target.value)}
                      placeholder="What happened, and what needs to change"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Only you and your staff see this.
                    </p>
                  </div>

                  <div>
                    <label className="flex items-start gap-3 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={notifyParent}
                        onChange={(e) => setNotifyParent(e.target.checked)}
                        className="w-4 h-4 accent-[#E43125] mt-0.5"
                      />
                      <span className="font-medium">
                        Email the parent about this suspension
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      For discipline matters most academies phone the parent
                      first.
                    </p>
                  </div>
                </div>
              </>
            )}

            {modal.type === "unsuspend" && (
              <>
                <h2 className="text-lg font-bold mb-2">Lift suspension</h2>
                <p className="text-gray-600 text-sm">
                  Put{" "}
                  <span className="font-medium">
                    {modalRow.fullname || "this player"}
                  </span>{" "}
                  back on the active list?
                  {modalRow.suspensionReason
                    ? ` They were suspended for: ${suspensionReasonLabel(
                        modalRow.suspensionReason
                      ).toLowerCase()}.`
                    : ""}
                </p>
                {modalRow.suspensionNote && (
                  <p className="text-gray-500 text-sm mt-2 break-words">
                    Note: {modalRow.suspensionNote}
                  </p>
                )}
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
                {MODAL_SUBMIT_LABEL[modal.type]}
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
