export type MembershipStatus = "active" | "on_hold" | "stopped";

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

export type StatusFilter = "all" | "active" | "on_hold" | "overdue" | "stopped";

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
