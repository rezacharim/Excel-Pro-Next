/** One family that owes money — a row of GET /collections. */
export interface CollectionsRow {
  userId: number;
  fullname: string;
  parent_name: string;
  email: string;
  phone_number: string;
  activePlan: string | null;
  membershipStatus: string;
  currentSubscriptionEndDate: string | null;
  daysOverdue: number;
  amountDue: number;
  remindersSent: number;
  lastReminderAt: string | null;
  lastContactAt: string | null;
  lastContactNote: string | null;
  lastContactMethod: string | null;
  followUpAt: string | null;
  lastPaymentAt: string | null;
}

/** Methods an admin can log by hand. */
export const CONTACT_METHODS = ["call", "email", "text", "in_person"] as const;

export type ContactMethod = (typeof CONTACT_METHODS)[number];

/**
 * A contact history entry. `method` is a plain string because the backend also
 * writes "reminder_email" rows automatically when a reminder is emailed.
 */
export interface ContactLogEntry {
  id: number;
  method: string;
  note: string | null;
  followUpAt: string | null;
  adminUsername: string;
  createdAt: string;
}

/** Body of POST /collections/:userId/contact-log */
export interface CreateContactLogDto {
  method: ContactMethod;
  note: string;
  followUpAt?: string;
}

/** Response of POST /collections/:userId/send-reminder */
export interface SendReminderResult {
  success: true;
  sentTo: string;
  remindersSent: number;
}

/** Response of POST /collections/send-reminders */
export interface SendRemindersResult {
  sent: number;
  failed: number;
  errors: string[];
}

export type CollectionsFilter =
  | "all"
  | "never_contacted"
  | "contacted_unpaid"
  | "follow_up_due";
