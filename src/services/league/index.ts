const API = process.env.NEXT_PUBLIC_API_URL;

export interface LeagueAgeGroup {
  ageGroup: string;
  capacity: number;
  taken: number;
  spotsLeft: number;
  /** Ready-to-render wording, decided server-side so it is changeable without a deploy. */
  label: string;
  tone: "ok" | "medium" | "low" | "full";
  show: boolean;
}

export interface LeagueSeason {
  id: number;
  name: string;
  startsOn: string | null;
  firstPaymentDue: string | null;
  secondPaymentDue: string | null;
  feeTotal: number;
  feeLate: number;
  feePayInFull: number | null;
  registrationOpen: boolean;
  isLateNow: boolean;
  lateFeeFrom: string | null;
  spotsDisplay: "count" | "threshold" | "status" | "hidden";
  /** Players who registered in the last 7 days — real momentum, not scarcity. */
  recentSignups: number;
  paymentInstructions: string | null;
  ageGroups: LeagueAgeGroup[];
}

export interface LeagueInstallment {
  number: number;
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
}

export interface LeagueRegistration {
  id: number;
  ageGroup: string;
  player: string;
  status:
    | "pending_payment"
    | "confirmed"
    | "waitlist"
    | "withdrawn"
    | "submitted";
  feeTotal: number;
  amountPaid: number;
  balance: number;
  isLate: boolean;
  payInFull: boolean;
  installments: LeagueInstallment[];
}

export interface PortalLeaguePlayer {
  userId: number;
  fullname: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: "M" | "F";
  phone: string | null;
  address1: string | null;
  city: string | null;
  postalCode: string | null;
  parentName: string | null;
  medicalNotes: string | null;
  registration: LeagueRegistration | null;
  /** Fields the league needs that are not yet on the member record. */
  missingForLeague: string[];
  /** True once the roster has been filed — the snapshot is frozen. */
  detailsLocked: boolean;
}

export interface UpdatePlayerPayload {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: "M" | "F";
  phone?: string;
  address1?: string;
  city?: string;
  postalCode?: string;
  parentName?: string;
  medicalNotes?: string;
}

export interface AddPlayerPayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "M" | "F";
  phone: string;
  address1: string;
  city: string;
  postalCode: string;
  parentName?: string;
  medicalNotes?: string;
}

export interface PortalLeagueOverview {
  season: {
    id: number;
    name: string;
    startsOn: string | null;
    firstPaymentDue: string | null;
    secondPaymentDue: string | null;
    registrationOpen: boolean;
    feeTotal: number;
    paymentInstructions: string | null;
  } | null;
  players: PortalLeaguePlayer[];
}

export interface PublicRegisterPayload {
  ageGroup: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "M" | "F";
  email: string;
  phone: string;
  address1: string;
  city: string;
  province?: string;
  postalCode: string;
  parentName?: string;
  medicalNotes?: string;
  previousClub?: string;
  consentTerms: boolean;
  consentPhoto?: boolean;
  payInFull?: boolean;
}

export interface PortalRegisterPayload {
  userId: number;
  ageGroup: string;
  consentTerms: boolean;
  consentPhoto?: boolean;
  payInFull?: boolean;
  dateOfBirth?: string;
  address1?: string;
  city?: string;
  postalCode?: string;
  medicalNotes?: string;
}

export interface BookTrialPayload {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "M" | "F";
  ageGroup: string;
  parentName: string;
  email: string;
  phone: string;
  city?: string;
  previousClub?: string;
  position?: string;
  preferredWhen?: string;
  howHeard?: string;
}

const parse = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || "Something went wrong. Please try again.";
    throw new Error(message);
  }
  return data;
};

export const getLeagueSeason = async (): Promise<LeagueSeason> =>
  parse(await fetch(`${API}/league/season`, { cache: "no-store" }));

export const registerForLeague = async (
  payload: PublicRegisterPayload
): Promise<LeagueRegistration> =>
  parse(
    await fetch(`${API}/league/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );

export const bookTrial = async (payload: BookTrialPayload) =>
  parse(
    await fetch(`${API}/league/trials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );

/**
 * The parent's existing dashboard session. Reusing it is the whole point:
 * a family already known to the academy should never retype an address.
 */
export const getPortalLeague = async (
  token: string
): Promise<PortalLeagueOverview> =>
  parse(
    await fetch(`${API}/portal/league`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
  );

export const portalRegisterForLeague = async (
  token: string,
  payload: PortalRegisterPayload
): Promise<LeagueRegistration> =>
  parse(
    await fetch(`${API}/portal/league/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
  );

/** A parent correcting their own family's details. */
export const updatePortalPlayer = async (
  token: string,
  userId: number,
  payload: UpdatePlayerPayload
): Promise<PortalLeagueOverview> =>
  parse(
    await fetch(`${API}/portal/league/player/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
  );

/**
 * A family who trains with the academy but has never been on file — they
 * joined at the field, not through the website.
 */
export const addPortalPlayer = async (
  token: string,
  payload: AddPlayerPayload
): Promise<PortalLeagueOverview> =>
  parse(
    await fetch(`${API}/portal/league/player`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
  );
