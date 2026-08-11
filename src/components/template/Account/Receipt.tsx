"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  PortalAuthError,
  PortalPayment,
  PortalPlayer,
  getPortalMe,
} from "@/services/portal";
import { paymentDescription } from "./Account";

const TOKEN_KEY = "portal_token";

const ACADEMY = {
  name: "Excel Pro Soccer Academy",
  email: "excelprosocceracademy@gmail.com",
  phone: "+1 647-703-7821",
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatAmount = (amount: number, currency?: string | null) =>
  `$${Number(amount).toFixed(2)}${currency ? ` ${currency.toUpperCase()}` : ""}`;

const receiptNumber = (id: number) => `EP-${String(id).padStart(6, "0")}`;

const ReceiptHeader = () => (
  <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-gray-900 pb-6">
    <div className="flex items-center gap-4">
      <Image
        src="/images/logo/excelpro_logo.png"
        alt="Excel Pro Soccer Academy"
        width={72}
        height={72}
        className="object-contain"
      />
      <div>
        <p className="text-lg font-bold text-gray-900">{ACADEMY.name}</p>
        <p className="text-sm text-gray-600">{ACADEMY.email}</p>
        <p className="text-sm text-gray-600">{ACADEMY.phone}</p>
      </div>
    </div>
  </div>
);

const NotSignedIn = () => (
  <div className="max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center print:shadow-none print:border-0">
    <h1 className="text-xl font-bold text-gray-900">Sign in required</h1>
    <p className="mt-3 text-gray-600">
      Please sign in to your parent account to view receipts.
    </p>
    <Link
      href="/account"
      className="inline-block mt-6 px-8 py-3 bg-primary hover:bg-[#c9281e] text-white rounded-md font-medium transition-colors"
    >
      Go to My Account
    </Link>
  </div>
);

const Receipt = () => {
  const searchParams = useSearchParams();
  const playerParam = searchParams.get("player");
  const paymentParam = searchParams.get("payment");
  const yearParam = searchParams.get("year");

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "no-token" }
    | { status: "error"; message: string }
    | { status: "ready"; player: PortalPlayer; email: string }
  >({ status: "loading" });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState({ status: "no-token" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await getPortalMe(token);
        if (cancelled) return;
        const player = me.players.find(
          (p) => String(p.id) === String(playerParam)
        );
        if (!player) {
          setState({
            status: "error",
            message: "We couldn't find that player on your account.",
          });
          return;
        }
        setState({ status: "ready", player, email: me.email });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof PortalAuthError) {
          localStorage.removeItem(TOKEN_KEY);
          setState({ status: "no-token" });
        } else {
          setState({
            status: "error",
            message:
              err instanceof Error
                ? err.message
                : "Could not load the receipt. Please try again.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playerParam]);

  if (state.status === "loading") {
    return (
      <p className="text-center text-gray-500 py-16">Loading receipt...</p>
    );
  }

  if (state.status === "no-token") {
    return <NotSignedIn />;
  }

  if (state.status === "error") {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
        <p className="text-red-600">{state.message}</p>
        <Link
          href="/account"
          className="inline-block mt-6 px-8 py-3 bg-primary hover:bg-[#c9281e] text-white rounded-md font-medium transition-colors"
        >
          Back to My Account
        </Link>
      </div>
    );
  }

  const { player, email } = state;

  const payment: PortalPayment | undefined = paymentParam
    ? player.payments.find((p) => String(p.id) === String(paymentParam))
    : undefined;

  const year = yearParam ? parseInt(yearParam, 10) : null;
  const yearPayments =
    year !== null && !isNaN(year)
      ? player.payments
          .filter((p) => new Date(p.createdAt).getFullYear() === year)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
      : [];

  const isStatement = !paymentParam && year !== null && !isNaN(year);

  if (paymentParam && !payment) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
        <p className="text-red-600">
          We couldn&apos;t find that payment on this player&apos;s account.
        </p>
        <Link
          href="/account"
          className="inline-block mt-6 px-8 py-3 bg-primary hover:bg-[#c9281e] text-white rounded-md font-medium transition-colors"
        >
          Back to My Account
        </Link>
      </div>
    );
  }

  if (!payment && !isStatement) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
        <p className="text-gray-600">
          No receipt selected. Choose a payment from your account page.
        </p>
        <Link
          href="/account"
          className="inline-block mt-6 px-8 py-3 bg-primary hover:bg-[#c9281e] text-white rounded-md font-medium transition-colors"
        >
          Back to My Account
        </Link>
      </div>
    );
  }

  const total = yearPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const statementCurrency = yearPayments[0]?.currency;

  return (
    <>
      {/* Hide site chrome when printing; keep only the receipt area */}
      <style>{`
        @media print {
          header, footer, nav { display: none !important; }
          body { background: #fff !important; }
          main { padding: 0 !important; }
          #receipt-area {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
          }
          @page { size: A4; margin: 18mm; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0 print:max-w-none">
        {/* On-screen toolbar */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/account" className="hover:text-gray-700">
              My Account
            </Link>
            <span className="mx-2">/</span>
            <span className="text-red-500 font-medium">
              {isStatement ? "Statement" : "Receipt"}
            </span>
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-primary hover:bg-[#c9281e] text-white rounded-md font-medium transition-colors"
            >
              Print / Save as PDF
            </button>
            <p className="mt-1 text-xs text-gray-500">
              Use &apos;Save as PDF&apos; in the print window.
            </p>
          </div>
        </div>

        {/* Receipt / statement body */}
        <div
          id="receipt-area"
          className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-10"
        >
          <ReceiptHeader />

          {payment ? (
            <>
              <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-widest text-gray-900">
                  RECEIPT
                </h1>
                <div className="text-sm text-gray-600 text-right">
                  <p>
                    <span className="font-semibold text-gray-900">
                      Receipt no:
                    </span>{" "}
                    {receiptNumber(payment.id)}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Date:</span>{" "}
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-600">
                <p>
                  <span className="font-semibold text-gray-900">Player:</span>{" "}
                  {player.fullname}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">
                    Parent email:
                  </span>{" "}
                  {email}
                </p>
              </div>

              <table className="w-full mt-8 text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b-2 border-gray-900">
                    <th className="py-2 pr-3 font-semibold">Description</th>
                    <th className="py-2 pr-3 font-semibold">Method</th>
                    <th className="py-2 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 text-gray-700">
                    <td className="py-3 pr-3">
                      {paymentDescription(payment)}
                      {payment.subscriptionEndDate && (
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Membership valid until{" "}
                          {formatDate(payment.subscriptionEndDate)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 capitalize">{payment.method}</td>
                    <td className="py-3 text-right font-medium">
                      {formatAmount(payment.amount, payment.currency)}
                    </td>
                  </tr>
                  <tr className="text-gray-900">
                    <td className="py-3 pr-3 font-bold" colSpan={2}>
                      TOTAL
                    </td>
                    <td className="py-3 text-right font-bold">
                      {formatAmount(payment.amount, payment.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-10 text-sm text-gray-600">
                Thank you for being part of the Excel Pro Soccer Academy family.
              </p>
            </>
          ) : (
            <>
              <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-widest text-gray-900">
                  ANNUAL STATEMENT {year}
                </h1>
                <div className="text-sm text-gray-600 text-right">
                  <p>
                    <span className="font-semibold text-gray-900">Issued:</span>{" "}
                    {formatDate(new Date().toISOString())}
                  </p>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-600">
                <p>
                  <span className="font-semibold text-gray-900">Player:</span>{" "}
                  {player.fullname}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">
                    Parent email:
                  </span>{" "}
                  {email}
                </p>
              </div>

              <table className="w-full mt-8 text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b-2 border-gray-900">
                    <th className="py-2 pr-3 font-semibold">Date</th>
                    <th className="py-2 pr-3 font-semibold">Receipt no</th>
                    <th className="py-2 pr-3 font-semibold">Description</th>
                    <th className="py-2 pr-3 font-semibold">Method</th>
                    <th className="py-2 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {yearPayments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-gray-200 text-gray-700"
                    >
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {receiptNumber(p.id)}
                      </td>
                      <td className="py-2.5 pr-3">{paymentDescription(p)}</td>
                      <td className="py-2.5 pr-3 capitalize">{p.method}</td>
                      <td className="py-2.5 text-right font-medium">
                        {formatAmount(p.amount, p.currency)}
                      </td>
                    </tr>
                  ))}
                  {yearPayments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-3 text-gray-500">
                        No payments recorded in {year}.
                      </td>
                    </tr>
                  )}
                  <tr className="text-gray-900">
                    <td className="py-3 pr-3 font-bold" colSpan={4}>
                      TOTAL
                    </td>
                    <td className="py-3 text-right font-bold">
                      {formatAmount(total, statementCurrency)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-10 text-sm text-gray-600">
                Thank you for being part of the Excel Pro Soccer Academy family.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Receipt;
