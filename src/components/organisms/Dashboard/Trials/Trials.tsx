"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import {
  CalendarClock,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { IMODEL, SEASONS } from "@/data/academy";

/**
 * Dashboard → Trials.
 *
 * Every request from /trials (I-Model Team trials and free first sessions)
 * lands here. The usual flow: a request comes in (you also get an email),
 * you press "Send invitation", pick the day and time, and the family gets an
 * email with the date, the place and what to bring. After the session, set
 * the status: attended → offered a place → joined.
 *
 * The backend stores the kind and the preferred session in `preferredWhen`
 * ("I-Model trial · Monday 5–6 pm"), so no database change was needed.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const VENUE = SEASONS.indoor.venue;

interface TrialBooking {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  ageGroup: string;
  parentName: string;
  email: string;
  phone: string;
  city: string | null;
  previousClub: string | null;
  position: string | null;
  preferredWhen: string | null;
  howHeard: string | null;
  status: Status;
  coachNotes: string | null;
  scheduledFor: string | null;
  createdAt: string;
}

type Status = "booked" | "attended" | "no_show" | "offered" | "joined" | "declined";
type Kind = "imodel" | "free";

const STATUS_LABEL: Record<Status, string> = {
  booked: "Requested",
  attended: "Attended",
  no_show: "Didn't come",
  offered: "Offered a place",
  joined: "Joined",
  declined: "Declined",
};

const STATUS_TONE: Record<Status, string> = {
  booked: "bg-amber-100 text-amber-800",
  attended: "bg-blue-100 text-blue-800",
  no_show: "bg-gray-200 text-gray-700",
  offered: "bg-purple-100 text-purple-800",
  joined: "bg-green-100 text-green-800",
  declined: "bg-gray-200 text-gray-700",
};

const kindOf = (t: TrialBooking): Kind =>
  /i-?model/i.test(t.preferredWhen ?? "") ? "imodel" : "free";

const preferredText = (t: TrialBooking) =>
  (t.preferredWhen ?? "").split("·")[1]?.trim() || "any session";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Next date for "Monday 5–6 pm" (today counts if it hasn't started), as input values. */
const suggestFrom = (preferred: string): { date: string; time: string } => {
  const pad = (n: number) => `${n}`.padStart(2, "0");
  const now = new Date();
  const m = /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(\d{1,2})(?::(\d{2}))?/i.exec(preferred);
  let hour = 17;
  let minute = 0;
  const target = new Date(now);
  if (m) {
    hour = Number(m[2]);
    minute = Number(m[3] ?? 0);
    if (/pm/i.test(preferred) && hour < 12) hour += 12;
    const want = DAYS.findIndex((d) => d.toLowerCase() === m[1].toLowerCase());
    let add = (want - now.getDay() + 7) % 7;
    if (add === 0 && (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute))) add = 7;
    target.setDate(now.getDate() + add);
  } else {
    target.setDate(now.getDate() + 1);
  }
  return {
    date: `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`,
    time: `${pad(hour)}:${pad(minute)}`,
  };
};

const whenTextOf = (date: Date) =>
  `${date.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })} at ${date
    .toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })
    .replace("a.m.", "am")
    .replace("p.m.", "pm")}`;

const shortDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" })
    : "";

const TABS: { key: string; label: string; test: (t: TrialBooking) => boolean }[] = [
  { key: "todo", label: "To invite", test: (t) => t.status === "booked" && !t.scheduledFor },
  { key: "invited", label: "Invited", test: (t) => t.status === "booked" && !!t.scheduledFor },
  { key: "after", label: "After the session", test: (t) => ["attended", "offered", "no_show"].includes(t.status) },
  { key: "joined", label: "Joined", test: (t) => t.status === "joined" },
  { key: "all", label: "All", test: () => true },
];

const TrialsAdmin = () => {
  const token = Cookies.get("auth_token");
  const [rows, setRows] = useState<TrialBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("todo");
  const [kind, setKind] = useState<"all" | Kind>("all");
  const [inviting, setInviting] = useState<TrialBooking | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const auth = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/league/admin/trials`, { headers: auth });
      if (!res.ok) throw new Error("Could not load trial requests");
      setRows(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    load();
  }, [load]);

  const say = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const patch = async (id: number, body: Partial<Pick<TrialBooking, "status" | "coachNotes">>) => {
    const res = await fetch(`${API_URL}/league/admin/trials/${id}`, {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      say("Could not save — please try again");
      return;
    }
    const saved: TrialBooking = await res.json();
    setRows((rs) => rs.map((r) => (r.id === id ? saved : r)));
  };

  const visible = rows
    .filter((t) => kind === "all" || kindOf(t) === kind)
    .filter(TABS.find((x) => x.key === tab)!.test);

  const count = (key: string) =>
    rows.filter((t) => kind === "all" || kindOf(t) === kind).filter(TABS.find((x) => x.key === key)!.test).length;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trials</h1>
          <p className="text-sm text-gray-500">
            {IMODEL.name} trials and free sessions booked on the website. Send
            each family their date, then mark how it went.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              tab === t.key ? "bg-[#E43125] font-semibold text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"
            }`}
          >
            {t.label} <span className="opacity-75">{count(t.key)}</span>
          </button>
        ))}
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as "all" | Kind)}
          className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm"
          aria-label="Kind of trial"
        >
          <option value="all">I-Model trials and free sessions</option>
          <option value="imodel">{IMODEL.name} trials only</option>
          <option value="free">Free sessions only</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="mr-2 animate-spin" size={18} /> Loading…
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl bg-white p-10 text-center text-gray-500 ring-1 ring-gray-200">
          Nothing here. New requests from excelproso.com/trials appear under
          &ldquo;To invite&rdquo;.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <div key={t.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${kindOf(t) === "imodel" ? "bg-[#020022] text-white" : "bg-red-50 text-[#E43125]"}`}>
                      {kindOf(t) === "imodel" ? IMODEL.name : "Free session"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                    <span className="text-xs text-gray-400">requested {shortDate(t.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {t.firstName} {t.lastName}{" "}
                    <span className="text-sm font-medium text-gray-500">
                      · {t.ageGroup}
                      {t.dateOfBirth ? ` · born ${t.dateOfBirth}` : ""}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Prefers <strong>{preferredText(t)}</strong>
                    {t.previousClub ? ` · club: ${t.previousClub}` : ""}
                    {t.position ? ` · ${t.position}` : ""}
                    {t.howHeard ? ` · heard via ${t.howHeard}` : ""}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span>{t.parentName}</span>
                    <a href={`tel:${t.phone}`} className="inline-flex items-center gap-1 text-[#E43125]">
                      <Phone size={14} /> {t.phone}
                    </a>
                    <a href={`mailto:${t.email}`} className="inline-flex items-center gap-1 text-[#E43125]">
                      <Mail size={14} /> {t.email}
                    </a>
                  </p>
                  {t.scheduledFor && (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-sm text-green-800">
                      <CalendarClock size={14} /> Invited for {whenTextOf(new Date(t.scheduledFor))}
                    </p>
                  )}
                  <textarea
                    defaultValue={t.coachNotes ?? ""}
                    onBlur={(e) => {
                      if ((e.target.value || "") !== (t.coachNotes ?? "")) patch(t.id, { coachNotes: e.target.value });
                    }}
                    rows={1}
                    placeholder="Coach notes (saved when you click away)"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex shrink-0 flex-row gap-2 md:w-48 md:flex-col">
                  <button
                    onClick={() => setInviting(t)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#E43125] px-3 py-2 text-sm font-semibold text-white hover:bg-[#c9281e]"
                  >
                    <Send size={15} /> {t.scheduledFor ? "Send new date" : "Send invitation"}
                  </button>
                  <select
                    value={t.status}
                    onChange={(e) => patch(t.id, { status: e.target.value as Status })}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    aria-label="Status"
                  >
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {inviting && (
        <InviteDialog
          trial={inviting}
          auth={auth}
          onClose={() => setInviting(null)}
          onSent={(saved) => {
            setRows((rs) => rs.map((r) => (r.id === saved.id ? saved : r)));
            setInviting(null);
            say(`Invitation sent to ${saved.email}`);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[#020022] px-4 py-3 text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
};

const InviteDialog = ({
  trial,
  auth,
  onClose,
  onSent,
}: {
  trial: TrialBooking;
  auth: Record<string, string>;
  onClose: () => void;
  onSent: (saved: TrialBooking) => void;
}) => {
  const first = suggestFrom(preferredText(trial));
  const [date, setDate] = useState(first.date);
  const [time, setTime] = useState(first.time);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const when = new Date(`${date}T${time || "17:00"}:00`);
  const valid = !isNaN(when.getTime()) && when.getTime() > Date.now() - 3600_000;
  const kind = kindOf(trial);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/league/admin/trials/${trial.id}/invite`, {
        method: "POST",
        headers: auth,
        body: JSON.stringify({
          kind,
          scheduledFor: when.toISOString(),
          whenText: whenTextOf(when),
          where: VENUE.name,
          address: VENUE.address,
          mapsUrl: VENUE.mapsUrl,
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "The invitation could not be sent");
      onSent(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold">Send {kind === "imodel" ? "trial" : "free session"} invitation</h2>
        <p className="mb-4 text-sm text-gray-500">
          {trial.firstName} {trial.lastName} · {trial.ageGroup} · prefers {preferredText(trial)}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-gray-700">Day</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-gray-700">Time</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-gray-700">Extra line in the email (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Ask for Coach Reza at the entrance" className="w-full rounded-lg border border-gray-200 px-3 py-2" />
        </label>
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          {valid ? (
            <>
              <strong>{trial.email}</strong> will get: <em>{whenTextOf(when)}</em> at {VENUE.name}, {VENUE.address} — with a map link and what to bring.
            </>
          ) : (
            "Choose a day and time that hasn't passed."
          )}
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={send}
            disabled={!valid || busy}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy && <Loader2 className="animate-spin" size={16} />} Send invitation
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialsAdmin;
