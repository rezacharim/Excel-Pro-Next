/** One bucket of the rolling 12-month revenue chart. */
export interface FinanceMonthRow {
  month: string;
  label: string;
  total: number;
  count: number;
}

export interface FinanceRecentPayment {
  id: number;
  playerName: string;
  amount: number;
  method: string;
  type: string;
  periodLabel: string | null;
  createdAt: string;
}

export interface FinanceByType {
  membership: number;
  league: number;
}

export interface FinanceByMethod {
  etransfer: number;
  cash: number;
  other: number;
}

/** Response of GET /finance/summary?year=YYYY */
export interface FinanceSummary {
  collectedThisMonth: number;
  collectedThisYear: number;
  collectedAllTime: number;
  outstandingAmount: number;
  outstandingCount: number;
  expectedNext30Days: number;
  expectedNext30Count: number;
  activeMembers: number;
  byMonth: FinanceMonthRow[];
  byType: FinanceByType;
  byMethod: FinanceByMethod;
  recentPayments: FinanceRecentPayment[];
}

/** One labelled slice of a breakdown block. */
export interface BreakdownSlice {
  label: string;
  amount: number;
  color: string;
}
