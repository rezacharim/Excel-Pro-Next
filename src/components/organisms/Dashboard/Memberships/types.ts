export type MembershipStatus =
  | "active"
  | "on_hold"
  | "stopped"
  | "suspended";

/** Why an account was suspended — mirrors the backend's allowed values. */
export const SUSPENSION_REASONS = [
  "late_payment",
  "discipline",
  "paperwork",
  "medical",
  "other",
] as const;

export type SuspensionReason = (typeof SUSPENSION_REASONS)[number];

export const ATTENDANCE_STATUSES = [
  "attending",
  "irregular",
  "not_attending",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface MembershipRow {
  id: number;
  fullname: string;
  parent_name: string;
  email: string;
  phone_number: string;
  activePlan: string;
  membershipStatus: MembershipStatus;
  currentSubscriptionEndDate: string | null;
  daysRemaining: number | null;
  overdue: boolean;
  holdResumeAt: string | null;
  subscriptionCounter: number;
  suspendedAt: string | null;
  suspensionReason: string | null;
  suspensionNote: string | null;
  lastReminderAt: string | null;
  remindersSent: number;
  internalNote: string | null;
  /** Free-form on the wire; normalise before trusting it. */
  attendanceStatus: string;
  dateOfBirth: string | null;
}

export type PaymentMethod = "etransfer" | "cash" | "other";

export interface RecordPaymentDto {
  amount?: number;
  method?: PaymentMethod;
  note?: string;
}

export interface HoldDto {
  resumeAt?: string;
  note?: string;
}

export interface ExtendDto {
  days: number;
  note?: string;
}

/** Body of POST /membership/:userId/suspend */
export interface SuspendDto {
  reason: SuspensionReason;
  note?: string;
  notifyParent?: boolean;
}

/** Body of POST /membership/:userId/notes */
export interface UpdateNotesDto {
  internalNote?: string;
  attendanceStatus?: AttendanceStatus;
}

/**
 * The drawer reuses the collections endpoints for reminders and contact
 * history, so it reuses their response types rather than redeclaring them.
 */
export type { ContactLogEntry, SendReminderResult } from "../Collections/types";

export type StatusFilter =
  | "all"
  | "active"
  | "on_hold"
  | "overdue"
  | "suspended"
  | "stopped";

export type ProgramFilter =
  | "all"
  | "U5_U8"
  | "U9_U12"
  | "U13_U14"
  | "U15_U18"
  | "not_set";

export type AttendanceFilter = "all" | AttendanceStatus;

/** "default" keeps the server's overdue-first ordering. */
export type SortKey =
  | "default"
  | "player"
  | "plan"
  | "status"
  | "renewal"
  | "payments";

export type SortDirection = "asc" | "desc";

/** One player row sent to POST /membership/import */
export interface ImportPlayerDto {
  fullname: string;
  dateOfBirth: string;
  gender: string;
  parent_name: string;
  email: string;
  phone_number: string;
  activePlan: string;
  membershipStatus: string;
  currentSubscriptionEndDate: string;
  address: string;
  city: string;
  postalCode: string;
  emergencyContactName: string;
  emergencyPhone: string;
}

export interface ImportSkippedRow {
  index: number;
  fullname: string;
  reason: string;
}

/** Response of POST /membership/import */
export interface ImportResult {
  created: number;
  createdIds: number[];
  skipped: ImportSkippedRow[];
}
