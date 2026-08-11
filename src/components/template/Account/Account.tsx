"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { sendEmailOtp } from "@/services/sendOtpCode";
import {
  PortalAuthError,
  PortalMe,
  PortalPayment,
  PortalPlayer,
  getPortalMe,
  portalLogin,
  requestHold,
} from "@/services/portal";

const TOKEN_KEY = "portal_token";
const EMAIL_KEY = "portal_email";

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatAmount = (amount: number, currency?: string | null) =>
  `$${Number(amount).toFixed(2)}${currency ? ` ${currency.toUpperCase()}` : ""}`;

export const paymentDescription = (p: PortalPayment) =>
  p.periodLabel || (p.type === "league" ? "League fee" : "Membership — 2 months");

/* ------------------------------ Login view ------------------------------ */

const LoginCard = ({
  onSignedIn,
}: {
  onSignedIn: (token: string, email: string) => void;
}) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleSendCode = async () => {
    setError("");
    setInfo("");
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await sendEmailOtp(trimmed);
      setStep("otp");
      setCountdown(60);
      setInfo(`We sent a 6-digit code to ${trimmed}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send the code. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setError("");
    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      const data = await portalLogin(email.trim().toLowerCase(), otp.trim());
      onSignedIn(data.token, data.email);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid or expired code"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-xl font-bold text-gray-900">Parent sign in</h2>
      <p className="mt-2 text-sm text-gray-600">
        Enter the email you used to register your player and we&apos;ll send you a
        one-time sign-in code.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="portal-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email address
          </label>
          <input
            id="portal-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={step === "otp"}
            placeholder="you@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && step === "email") handleSendCode();
            }}
          />
        </div>

        {step === "otp" && (
          <div>
            <label
              htmlFor="portal-otp"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              6-digit code
            </label>
            <input
              id="portal-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full px-4 py-3 border border-gray-300 rounded-md tracking-[0.5em] text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSignIn();
              }}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              {countdown > 0 ? (
                <span>Resend code in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading}
                  className="text-primary font-medium hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                  setInfo("");
                }}
                className="hover:underline"
              >
                Change email
              </button>
            </div>
          </div>
        )}

        {info && <p className="text-sm text-green-600">{info}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {step === "email" ? (
          <button
            type="button"
            onClick={handleSendCode}
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-[#c9281e] text-white rounded-md font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-[#c9281e] text-white rounded-md font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        )}
      </div>
    </motion.div>
  );
};

/* ------------------------------- Modals -------------------------------- */

const ModalShell = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          &times;
        </button>
      </div>
      {children}
    </div>
  </div>
);

const HoldModal = ({
  player,
  token,
  onClose,
  onSuccess,
  onAuthError,
}: {
  player: PortalPlayer;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
  onAuthError: () => void;
}) => {
  const [resumeAt, setResumeAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      await requestHold(token, {
        userId: player.id,
        ...(resumeAt ? { resumeAt } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      onSuccess();
    } catch (err) {
      if (err instanceof PortalAuthError) {
        onAuthError();
        return;
      }
      setError(
        err instanceof Error ? err.message : "Could not send your request"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title={`Request a hold — ${player.fullname}`} onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">
        Ask the academy to pause this membership. We&apos;ll confirm by email once
        it&apos;s reviewed.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resume date (optional)
          </label>
          <input
            type="date"
            value={resumeAt}
            onChange={(e) => setResumeAt(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Anything the academy should know"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="w-full py-3 bg-primary hover:bg-[#c9281e] text-white rounded-md font-medium transition-colors disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send hold request"}
        </button>
      </div>
    </ModalShell>
  );
};

const StatusBadge = ({ player }: { player: PortalPlayer }) => {
  if (player.overdue) {
    const overdueDays =
      player.daysRemaining !== null ? Math.abs(player.daysRemaining) : null;
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        {overdueDays !== null
          ? `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`
          : "Payment overdue"}
      </span>
    );
  }
  if (player.membershipStatus === "on_hold") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        On hold
        {player.holdResumeAt ? ` · resumes ${formatDate(player.holdResumeAt)}` : ""}
      </span>
    );
  }
  if (player.membershipStatus === "stopped") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
        Stopped
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      Active
    </span>
  );
};

const RequestStatusChip = ({ status }: { status: string }) => {
  const styles =
    status === "approved"
      ? "bg-green-100 text-green-700"
      : status === "denied"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${styles}`}
    >
      {status}
    </span>
  );
};

const PaymentsSection = ({ player }: { player: PortalPlayer }) => {
  const years = useMemo(() => {
    const set = new Set<number>();
    player.payments.forEach((p) => {
      const y = new Date(p.createdAt).getFullYear();
      if (!isNaN(y)) set.add(y);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [player.payments]);

  const [year, setYear] = useState<number | null>(years[0] ?? null);

  useEffect(() => {
    setYear(years[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years.join(",")]);

  if (player.payments.length === 0) {
    return (
      <div className="mt-5 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-bold text-gray-900">Payments &amp; Receipts</h4>
        <p className="mt-2 text-sm text-gray-500">No payments recorded yet.</p>
      </div>
    );
  }

  const visible =
    year === null
      ? player.payments
      : player.payments.filter(
          (p) => new Date(p.createdAt).getFullYear() === year
        );

  return (
    <div className="mt-5 pt-4 border-t border-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-gray-900">Payments &amp; Receipts</h4>
        <div className="flex items-center gap-2">
          <select
            value={year ?? ""}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Statement year"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {year !== null && (
            <Link
              href={`/account/receipt?player=${player.id}&year=${year}`}
              className="px-3 py-1.5 text-sm font-medium border border-primary text-primary rounded-md hover:bg-primary hover:text-white transition-colors"
            >
              Yearly statement
            </Link>
          )}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
              <th className="py-2 pr-3 font-semibold">Date</th>
              <th className="py-2 pr-3 font-semibold">Description</th>
              <th className="py-2 pr-3 font-semibold">Amount</th>
              <th className="py-2 pr-3 font-semibold">Method</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 text-gray-700">
                <td className="py-2.5 pr-3 whitespace-nowrap">
                  {formatDate(p.createdAt)}
                </td>
                <td className="py-2.5 pr-3">{paymentDescription(p)}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap font-medium">
                  {formatAmount(p.amount, p.currency)}
                </td>
                <td className="py-2.5 pr-3 capitalize">{p.method}</td>
                <td className="py-2.5 pr-3 capitalize">{p.status}</td>
                <td className="py-2.5 text-right">
                  <Link
                    href={`/account/receipt?player=${player.id}&payment=${p.id}`}
                    className="text-primary font-medium hover:underline whitespace-nowrap"
                  >
                    Receipt
                  </Link>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="py-3 text-gray-500">
                  {player.payments.length === 0
                    ? "No payments recorded yet — your receipts and yearly statement will appear here after your first payment."
                    : `No payments in ${year}.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PlayerCard = ({
  player,
  token,
  onRefresh,
  onAuthError,
}: {
  player: PortalPlayer;
  token: string;
  onRefresh: () => void;
  onAuthError: () => void;
}) => {
  const [modal, setModal] = useState<"hold" | null>(null);
  const [successNote, setSuccessNote] = useState("");

  const renewalTone = player.overdue
    ? "text-red-600"
    : player.daysRemaining !== null && player.daysRemaining <= 7
    ? "text-amber-600"
    : "text-gray-600";

  const daysLine = () => {
    if (player.currentSubscriptionEndDate === null) return null;
    if (player.overdue && player.daysRemaining !== null) {
      const n = Math.abs(player.daysRemaining);
      return `Renewal was due ${formatDate(
        player.currentSubscriptionEndDate
      )} — ${n} day${n === 1 ? "" : "s"} overdue`;
    }
    if (player.daysRemaining !== null) {
      return `Renews ${formatDate(player.currentSubscriptionEndDate)} — ${
        player.daysRemaining
      } day${player.daysRemaining === 1 ? "" : "s"} remaining`;
    }
    return `Renews ${formatDate(player.currentSubscriptionEndDate)}`;
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-6"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-bold text-gray-900">{player.fullname}</h3>
        {player.activePlan && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-primary border border-red-100">
            {player.activePlan}
          </span>
        )}
        <StatusBadge player={player} />
      </div>

      {daysLine() && (
        <p className={`mt-2 text-sm font-medium ${renewalTone}`}>{daysLine()}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setSuccessNote("");
            setModal("hold");
          }}
          className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:border-primary hover:text-primary transition-colors"
        >
          Request a hold
        </button>
      </div>

      {successNote && (
        <p className="mt-3 text-sm text-green-600 font-medium">{successNote}</p>
      )}

      {player.requests.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-bold text-gray-900">Requests</h4>
          <ul className="mt-2 space-y-2">
            {player.requests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-2 text-sm text-gray-600"
              >
                <span className="font-medium text-gray-800">
                  {r.kind === "hold" ? "Hold request" : "Request"}
                </span>
                <RequestStatusChip status={r.status} />
                <span className="text-xs text-gray-400">
                  {formatDate(r.createdAt)}
                </span>
                {r.kind === "hold" && r.resumeAt && (
                  <span className="text-xs text-gray-400">
                    · resume {formatDate(r.resumeAt)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <PaymentsSection player={player} />

      {modal === "hold" && (
        <HoldModal
          player={player}
          token={token}
          onClose={() => setModal(null)}
          onAuthError={onAuthError}
          onSuccess={() => {
            setModal(null);
            setSuccessNote("Sent — the academy will confirm by email.");
            onRefresh();
          }}
        />
      )}
    </motion.div>
  );
};

/* ----------------------------- Main template ---------------------------- */

const Account = () => {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<PortalMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setToken(null);
    setMe(null);
    setError("");
  }, []);

  const loadMe = useCallback(
    async (t: string, silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const data = await getPortalMe(t);
        setMe(data);
      } catch (err) {
        if (err instanceof PortalAuthError) {
          signOut();
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load your account. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [signOut]
  );

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    setToken(stored);
    setReady(true);
    if (stored) loadMe(stored);
  }, [loadMe]);

  const handleSignedIn = (t: string, email: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(EMAIL_KEY, email);
    setToken(t);
    loadMe(t);
  };

  return (
    <section className="bg-white overflow-hidden">
      {/* Hero */}
      <motion.div
        className="bg-[#FFF3F2] bg-[url('/images/other/tech-bg.png')] bg-cover bg-center px-4 sm:px-6 lg:px-8 pt-8 pb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex items-center text-sm text-gray-500 my-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-red-500 font-medium">My Account</span>
          </motion.div>

          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <motion.span
              className="inline-block px-3 py-1 bg-red-100 text-red-500 text-sm font-medium rounded-xl mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Parent Portal
            </motion.span>
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              My Excel Pro Account
            </motion.h1>
            <motion.p
              className="mt-4 text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              Check your player&apos;s membership, download receipts, and manage
              payments — all in one place.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        {!ready ? null : !token ? (
          <LoginCard onSignedIn={handleSignedIn} />
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Welcome back</p>
                <p className="font-semibold text-gray-900 break-all">
                  {me?.email ||
                    (typeof window !== "undefined"
                      ? localStorage.getItem(EMAIL_KEY)
                      : "")}
                </p>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:border-primary hover:text-primary transition-colors"
              >
                Sign out
              </button>
            </div>

            {loading && (
              <p className="text-center text-gray-500 py-8">
                Loading your account...
              </p>
            )}
            {error && (
              <p className="text-center text-red-600 py-4">{error}</p>
            )}

            {!loading && me && me.players.length === 0 && (
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 text-center text-gray-600">
                No players are registered under this email yet. If that seems
                wrong, please{" "}
                <Link href="/contact-us" className="text-primary hover:underline">
                  contact us
                </Link>
                .
              </div>
            )}

            {me?.players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                token={token}
                onAuthError={signOut}
                onRefresh={() => loadMe(token, true)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Account;
