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
  /** Allergies / medical info a coach must know. Optional. */
  medicalNotes: string | null;
  dateOfBirth: string | null;
}

export type PaymentMethod = "etransfer" | "cash" | "other";

export interface RecordPaymentDto {
  amount?: number;
  method?: PaymentMethod;
  note?: string;
  /** The day the money actually arrived, "YYYY-MM-DD". */
  paidAt?: string;
  /**
   * Start the new period at the payment date instead of extending the
   * current end date — used when catching up on an old payment.
   */
  startFromPaymentDate?: boolean;
}

/** The four real programs a player can belong to. */
export type PlanValue = "U5_U8" | "U9_U12" | "U13_U14" | "U15_U18";

export const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"] as const;

export type Gender = (typeof GENDER_OPTIONS)[number];

/** Actions POST /membership/bulk accepts. */
export type BulkAction = "stop" | "reactivate" | "suspend" | "set-plan";

/** Body of POST /membership/bulk */
export interface BulkMembershipDto {
  userIds: number[];
  action: BulkAction;
  reason?: string;
  plan?: string;
  note?: string;
}

export interface BulkFailure {
  userId: number;
  reason: string;
}

/** Response of POST /membership/bulk */
export interface BulkMembershipResult {
  updated: number;
  failed: BulkFailure[];
}

/** Body of POST /membership/:userId/set-renewal-date */
export interface SetRenewalDateDto {
  /** "YYYY-MM-DD" */
  date: string;
  note?: string;
}

/** Body of POST /membership/players */
export interface CreatePlayerDto {
  fullname: string;
  parent_name: string;
  phone_number: string;
  email?: string;
  activePlan: PlanValue;
  /** "YYYY-MM-DD" */
  currentSubscriptionEndDate?: string;
  /** "YYYY-MM-DD" */
  dateOfBirth?: string;
  gender?: Gender;
  internalNote?: string;
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
  medicalNotes?: string;
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
