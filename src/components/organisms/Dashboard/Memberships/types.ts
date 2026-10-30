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
  /** When the current paid period began. Null for records kept on paper. */
  currentSubscriptionStartDate: string | null;
  currentSubscriptionEndDate: string | null;
  /** When this family was last emailed an invitation to open their account. */
  invitedAt: string | null;
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
  /** Winter League / Indoor registrations for this player (newest first). */
  programs?: MemberProgram[];
}

/** A season registration shown on the member's row. */
export interface MemberProgram {
  registrationId: number;
  seasonId: number;
  seasonName: string;
  kind: string | null;
  ageGroup: string;
  status: string;
  feeTotal: number;
  amountPaid: number;
  balance: number;
}

export type PaymentMethod = "etransfer" | "cash" | "other";

export interface RecordPaymentDto {
  amount?: number;
  method?: PaymentMethod;
  /**
   * How many months this payment buys. Defaults to 2 on the server, which
   * matches the standard $380 / 2-month fee — but a sibling or monthly plan
   * pays a different amount for a different length of time, and the two must
   * not drift apart.
   */
  months?: number;
  /**
   * Short line shown to the parent in the receipt email, e.g.
   * "Sep-Oct 2026" or "Sibling rate - $370 total for both children".
   * Without it the email states only the amount, which reads oddly when one
   * family payment is split across two children.
   */
  periodLabel?: string;
  note?: string;
  /** The day the money actually arrived, "YYYY-MM-DD". */
  paidAt?: string;
  /**
   * Start the new period at the payment date instead of extending the
   * current end date — used when catching up on an old payment.
   */
  startFromPaymentDate?: boolean;
  /**
   * The exact paid period chosen in the date picker, "YYYY-MM-DD". When sent,
   * the server saves these dates as they are (any length, not only whole
   * months) and `months` / `startFromPaymentDate` are ignored.
   */
  periodStart?: string;
  periodEnd?: string;
  /**
   * A season registration (Indoor, Winter League…) of this player that the
   * same money also counts towards, so a payment is entered once.
   */
  registrationId?: number;
}

/** One payment of a player, as listed in the Payments dialog. */
export interface PlayerPayment {
  id: number;
  amount: number;
  method: string;
  type: string;
  status: string;
  periodLabel: string | null;
  note: string | null;
  /** The day the money arrived. */
  paidAt: string;
  subscriptionEndDate: string | null;
  isFirstTimePayment: boolean;
  countsToward: {
    registrationId: number;
    seasonName: string;
    ageGroup: string;
    installment: 1 | 2;
  } | null;
}

/** PATCH /membership/payments/:id — only the fields sent change. */
export interface UpdatePaymentDto {
  amount?: number;
  paidAt?: string;
  method?: PaymentMethod;
  note?: string;
  /** A registration id, or null to stop counting towards any season. */
  registrationId?: number | null;
}

/** The four real programs a player can belong to. */
export type PlanValue = "U5_U8" | "U9_U12" | "U13_U14" | "U15_U18";

export const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"] as const;

export type Gender = (typeof GENDER_OPTIONS)[number];

/** Actions POST /membership/bulk accepts. */
export type BulkAction =
  | "stop"
  | "reactivate"
  | "suspend"
  | "set-plan"
  | "set-period";

/** Body of POST /membership/bulk */
export interface BulkMembershipDto {
  userIds: number[];
  action: BulkAction;
  reason?: string;
  plan?: string;
  note?: string;
  /** set-period: paid-up-to date and optional start, YYYY-MM-DD */
  endDate?: string;
  startDate?: string;
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
  /** End of the paid period, "YYYY-MM-DD". */
  date: string;
  /** Optional start of the paid period, "YYYY-MM-DD". */
  startDate?: string;
  note?: string;
}

/** Body of POST /membership/invite */
export interface InviteFamiliesDto {
  userIds: number[];
  /** Email families that were already invited once before. */
  resend?: boolean;
}

/** One family the invite run could not email, with the server's wording. */
export interface InviteOutcome {
  fullname: string;
  reason: string;
}

/** Response of POST /membership/invite */
export interface InviteResult {
  sent: number;
  skipped: InviteOutcome[];
  failed: InviteOutcome[];
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

/** Has this family already been emailed an invitation? */
export type InvitedFilter = "all" | "invited" | "not_invited";

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
