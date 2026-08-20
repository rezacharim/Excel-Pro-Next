import type { ImportPlayerDto } from "./types";

/**
 * Client-side parsing helpers for the "Import from Excel" feature on the
 * Memberships dashboard screen. The heavy `xlsx` library is dynamically
 * imported by the caller; this module only maps parsed rows to the
 * /membership/import DTO shape.
 */

type PlayerField = keyof ImportPlayerDto;

/**
 * Accepted header names (after normalization) for every importable field.
 * Normalization lowercases, trims, strips trailing "*" markers and any
 * parenthetical hints, e.g. "Parent Phone (+1XXXXXXXXXX)*" -> "parent phone".
 */
const HEADER_MAP: Record<string, PlayerField> = {
  "full name": "fullname",
  fullname: "fullname",
  "player name": "fullname",
  "date of birth": "dateOfBirth",
  dob: "dateOfBirth",
  gender: "gender",
  "parent/guardian name": "parent_name",
  "parent guardian name": "parent_name",
  "parent name": "parent_name",
  "guardian name": "parent_name",
  "parent email": "email",
  email: "email",
  "parent phone": "phone_number",
  phone: "phone_number",
  "phone number": "phone_number",
  program: "activePlan",
  plan: "activePlan",
  "membership status": "membershipStatus",
  status: "membershipStatus",
  "membership end date": "currentSubscriptionEndDate",
  "end date": "currentSubscriptionEndDate",
  "renewal date": "currentSubscriptionEndDate",
  address: "address",
  city: "city",
  "postal code": "postalCode",
  "emergency contact name": "emergencyContactName",
  "emergency phone": "emergencyPhone",
};

/** Normalize a raw header cell so it can be looked up in HEADER_MAP. */
export const normalizeHeader = (raw: unknown): string =>
  String(raw ?? "")
    .replace(/\([^)]*\)/g, " ") // drop parenthetical hints
    .replace(/\*+\s*$/g, "") // drop trailing required-field markers
    .trim()
    .replace(/\*+$/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Map a header row to player fields; unknown columns are ignored. */
export const mapHeaders = (
  headerRow: unknown[]
): (PlayerField | null)[] =>
  headerRow.map((cell) => HEADER_MAP[normalizeHeader(cell)] ?? null);

const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * Convert a cell value to a YYYY-MM-DD string.
 * Handles JS Date objects (from xlsx cellDates:true), raw Excel serial
 * numbers, and pre-formatted strings.
 */
export const toDateString = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "";

  if (value instanceof Date && !isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
      value.getDate()
    )}`;
  }

  if (typeof value === "number" && isFinite(value)) {
    // Excel serial date (days since 1899-12-30)
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (isNaN(d.getTime())) return String(value);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
      d.getUTCDate()
    )}`;
  }

  const str = String(value).trim();
  // Already ISO-like: keep the date part
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${pad(Number(isoMatch[2]))}-${pad(
      Number(isoMatch[3])
    )}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
      parsed.getDate()
    )}`;
  }
  return str;
};

/**
 * Normalize program values like "U5-U8", "u5 u8", "u5_u8", "U5 to U8"
 * to the canonical "U5_U8" style. Unrecognized values pass through trimmed.
 */
export const normalizeProgram = (value: unknown): string => {
  const str = String(value ?? "").trim();
  if (!str) return "";
  const match = str.match(/u\s*-?\s*(\d{1,2})\s*(?:[-_–—/]|to|\s)+\s*u?\s*-?\s*(\d{1,2})/i);
  if (match) {
    return `U${Number(match[1])}_U${Number(match[2])}`;
  }
  return str;
};

const toCellString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return toDateString(value);
  return String(value).trim();
};

/**
 * Convert sheet rows (array-of-arrays, first row = headers) into the
 * players payload for POST /membership/import. Rows with no data are skipped.
 */
export const rowsToPlayers = (rows: unknown[][]): ImportPlayerDto[] => {
  if (!rows.length) return [];
  const fields = mapHeaders(rows[0]);

  const players: ImportPlayerDto[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => toCellString(cell) === "")) continue;

    const player: ImportPlayerDto = {
      fullname: "",
      dateOfBirth: "",
      gender: "",
      parent_name: "",
      email: "",
      phone_number: "",
      activePlan: "",
      membershipStatus: "",
      currentSubscriptionEndDate: "",
      address: "",
      city: "",
      postalCode: "",
      emergencyContactName: "",
      emergencyPhone: "",
    };

    fields.forEach((field, colIndex) => {
      if (!field) return;
      const value = row[colIndex];
      if (field === "dateOfBirth" || field === "currentSubscriptionEndDate") {
        player[field] = toDateString(value);
      } else if (field === "activePlan") {
        player[field] = normalizeProgram(value);
      } else {
        player[field] = toCellString(value);
      }
    });

    players.push(player);
  }
  return players;
};
