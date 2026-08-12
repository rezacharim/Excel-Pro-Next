const API = process.env.NEXT_PUBLIC_API_URL;

export interface PortalRequest {
  id: number;
  kind: "hold" | "installment";
  status: "pending" | "approved" | "denied";
  resumeAt: string | null;
  note: string | null;
  totalAmount: number | null;
  installments: number | null;
  createdAt: string;
}

export interface PortalPayment {
  id: number;
  amount: number;
  currency: string;
  method: string;
  type: "membership" | "league";
  status: string;
  periodLabel: string | null;
  subscriptionEndDate: string | null;
  createdAt: string;
}

export interface PortalPlayer {
  id: number;
  fullname: string;
  activePlan: string | null;
  membershipStatus: "active" | "on_hold" | "stopped";
  currentSubscriptionEndDate: string | null;
  daysRemaining: number | null;
  overdue: boolean;
  holdResumeAt: string | null;
  subscriptionCounter: number | null;
  requests: PortalRequest[];
  payments: PortalPayment[];
}

export interface PortalMe {
  email: string;
  players: PortalPlayer[];
}

export class PortalAuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "PortalAuthError";
  }
}

export const portalLogin = async (
  email: string,
  otp: string
): Promise<{ token: string; email: string }> => {
  const res = await fetch(`${API}/portal/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Invalid or expired code");
  }

  return data;
};

export const getPortalMe = async (token: string): Promise<PortalMe> => {
  const res = await fetch(`${API}/portal/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    throw new PortalAuthError();
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Could not load your account");
  }

  return data;
};

export interface RenewInfo {
  transferId: string | number;
  token: string;
  amount: number;
  plan: string;
  isFirstTimePayment: boolean;
  playerName: string;
}

/** Start a renewal: creates (or re-uses) a pending e-transfer payment request. */
export const portalRenew = async (
  token: string,
  payload: { userId: number }
): Promise<RenewInfo> => {
  const res = await fetch(`${API}/portal/renew`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    throw new PortalAuthError();
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Could not start the renewal");
  }

  return data;
};

/** Parent confirms they have sent the e-transfer for a renewal. */
export const confirmRenewal = async (
  transferToken: string
): Promise<{ success: boolean }> => {
  const res = await fetch(
    `${API}/transfer/token/${transferToken}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Could not confirm the payment");
  }

  return { success: true };
};

export const requestHold = async (
  token: string,
  payload: { userId: number; resumeAt?: string; note?: string }
): Promise<{ success: boolean }> => {
  const res = await fetch(`${API}/portal/request-hold`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    throw new PortalAuthError();
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Could not send your request");
  }

  return data;
};

export const requestInstallments = async (
  token: string,
  payload: {
    userId: number;
    totalAmount: number;
    installments: number;
    note?: string;
  }
): Promise<{ success: boolean }> => {
  const res = await fetch(`${API}/portal/request-installments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    throw new PortalAuthError();
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Could not send your request");
  }

  return data;
};
