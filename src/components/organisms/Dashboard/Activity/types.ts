/** One line of the audit trail, as returned by GET /activity. */
export interface ActivityEntry {
  id: number;
  adminId: number | null;
  adminUsername: string;
  action: string;
  targetType: string;
  targetId: number | null;
  targetName: string | null;
  details: string | null;
  createdAt: string;
}

/** GET /activity response */
export interface ActivityResponse {
  total: number;
  items: ActivityEntry[];
}

/**
 * The plain-English filter options. `prefix` is matched against the start of
 * the machine action key (e.g. "membership.record-payment"); an empty prefix
 * means "no action filter at all".
 */
export type ActivityCategoryKey =
  | "all"
  | "payments"
  | "memberships"
  | "admins"
  | "settings";

export interface ActivityCategory {
  key: ActivityCategoryKey;
  label: string;
  prefix: string;
}

/** Entries bucketed under one date heading ("Today", "12 August 2026"). */
export interface ActivityGroup {
  key: string;
  label: string;
  entries: ActivityEntry[];
}
