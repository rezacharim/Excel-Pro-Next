"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, UserPlus, X } from "lucide-react";

export interface LeagueMember {
  id: number;
  fullname: string;
  parent_name: string | null;
  email: string;
  phone_number: string | null;
  dateOfBirth: string | null;
  activePlan: string | null;
  membershipStatus: string;
}

export interface AddRegistrationPayload {
  /** Set when the player was picked from the member list. */
  userId?: number;
  ageGroup: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address1?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  parentName?: string;
  medicalNotes?: string;
  payInFull: boolean;
  sendEmail: boolean;
  adminNote?: string;
}

const GENDERS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

const EMPTY = {
  userId: undefined as number | undefined,
  ageGroup: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "M",
  email: "",
  phone: "",
  address1: "",
  city: "",
  province: "ON",
  postalCode: "",
  country: "Canada",
  parentName: "",
  medicalNotes: "",
  payInFull: false,
  sendEmail: true,
  adminNote: "",
};

/** Age at the season's start year — the usual way a soccer age group is set. */
const suggestAgeGroup = (
  dateOfBirth: string | null,
  seasonName: string,
  available: string[]
): string => {
  if (!dateOfBirth) return "";
  const birthYear = Number(String(dateOfBirth).slice(0, 4));
  const seasonYear = Number((seasonName.match(/\b(20\d{2})\b/) || [])[1]);
  if (!birthYear || !seasonYear) return "";
  const candidate = `U${seasonYear - birthYear}`;
  // Only offered when the season actually runs that group; a suggestion the
  // admin has to undo is worse than none.
  return available.includes(candidate) ? candidate : "";
};

const ageFrom = (dateOfBirth: string | null): string => {
  if (!dateOfBirth) return "no date of birth";
  const d = new Date(`${String(dateOfBirth).slice(0, 10)}T00:00:00`);
  if (isNaN(d.getTime())) return "no date of birth";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return `${age}, born ${d.toLocaleDateString("en-CA", {
    month: "short",
    year: "numeric",
  })}`;
};

/**
 * Adding a player to the league roster from the dashboard.
 *
 * Two ways in. Picking an existing member is the normal one: their record
 * already holds the name, birth date, contact and address, so registering them
 * is choosing a name and an age group. Anything left blank here is filled from
 * their record on the server — which is also why retyping an address is never
 * required, and why the roster stops collecting two spellings of one child.
 *
 * Typing a new player from scratch stays available for a family the academy
 * has never had on file.
 */
const AddRegistrationDialog = ({
  open,
  ageGroups,
  seasonName,
  members,
  membersLoading,
  registeredNames,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  ageGroups: string[];
  seasonName: string;
  members: LeagueMember[];
  membersLoading: boolean;
  /** Lower-cased names already on this season's roster. */
  registeredNames: string[];
  onCancel: () => void;
  onSubmit: (payload: AddRegistrationPayload) => Promise<void>;
}) => {
  const [mode, setMode] = useState<"member" | "new">("member");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ ...EMPTY });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode("member");
    setQuery("");
    setForm({ ...EMPTY, ageGroup: "" });
    setError(null);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const taken = useMemo(
    () => new Set(registeredNames.map((n) => n.trim().toLowerCase())),
    [registeredNames]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = members.filter((m) => m.membershipStatus !== "stopped");
    const scored = q
      ? list.filter(
          (m) =>
            m.fullname.toLowerCase().includes(q) ||
            (m.parent_name || "").toLowerCase().includes(q) ||
            (m.email || "").toLowerCase().includes(q)
        )
      : list;
    return scored.slice(0, 40);
  }, [members, query]);

  if (!open) return null;

  const set = (patch: Partial<typeof EMPTY>) =>
    setForm((f) => ({ ...f, ...patch }));

  const pick = (m: LeagueMember) => {
    const [first, ...rest] = (m.fullname || "").trim().split(/\s+/);
    const dob = m.dateOfBirth ? String(m.dateOfBirth).slice(0, 10) : "";
    set({
      userId: m.id,
      firstName: first || m.fullname,
      // The league sheet has two name columns and will not take a blank one.
      lastName: rest.join(" ") || "-",
      dateOfBirth: dob,
      email: m.email || "",
      phone: m.phone_number || "",
      parentName: m.parent_name || "",
      ageGroup: suggestAgeGroup(dob, seasonName, ageGroups) || form.ageGroup,
    });
    setError(null);
  };

  const selected = form.userId
    ? members.find((m) => m.id === form.userId) || null
    : null;

  // Address is only required when typing someone new. For a member it is read
  // from their record, and asking for it again is how duplicates start.
  const missing = [
    !form.ageGroup && "age group",
    !form.firstName.trim() && "first name",
    !form.lastName.trim() && "last name",
    !form.dateOfBirth && "date of birth",
    !form.email.trim() && "email",
    !form.phone.trim() && "phone",
    ...(form.userId
      ? []
      : [
          !form.address1.trim() && "address",
          !form.city.trim() && "city",
          !form.postalCode.trim() && "postal code",
        ]),
  ].filter(Boolean) as string[];

  const save = async () => {
    if (mode === "member" && !form.userId) {
      setError("Pick a player from the list first.");
      return;
    }
    if (missing.length) {
      setError(`Still needed: ${missing.join(", ")}.`);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        userId: form.userId,
        ageGroup: form.ageGroup,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        // Blank means "use what is on file" for a member, so send nothing.
        address1: form.address1.trim() || undefined,
        city: form.city.trim() || undefined,
        province: form.province.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        country: form.country.trim() || undefined,
        parentName: form.parentName.trim() || undefined,
        medicalNotes: form.medicalNotes.trim() || undefined,
        payInFull: form.payInFull,
        sendEmail: form.sendEmail,
        adminNote: form.adminNote.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the registration");
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
  };

  const field =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E43125]/30 focus:border-[#E43125]";
  const label = "block text-xs font-semibold text-gray-700 mb-1";
  const section =
    "mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-4 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add a registration</h2>
            <p className="mt-0.5 text-sm text-gray-600">
              {seasonName || "Active season"}
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* ---- which kind of player ---- */}
        <div className="flex gap-2 border-b border-gray-200 px-5 py-3">
          {(
            [
              ["member", "An existing member"],
              ["new", "Someone new"],
            ] as const
          ).map(([value, text]) => (
            <button
              key={value}
              onClick={() => {
                setMode(value);
                setForm({ ...EMPTY });
                setError(null);
              }}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                mode === value
                  ? "bg-[#020022] text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {text}
            </button>
          ))}
        </div>

        <div className="space-y-5 p-5">
          {mode === "member" && (
            <div>
              <p className={section}>Pick the player</p>

              <div className="relative mb-2">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by player, parent or email"
                  className={`${field} pl-9`}
                />
              </div>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200">
                {membersLoading ? (
                  <p className="flex items-center gap-2 p-4 text-sm text-gray-500">
                    <Loader2 size={14} className="animate-spin" />
                    Loading members…
                  </p>
                ) : matches.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">
                    No member matches that. Use{" "}
                    <button
                      onClick={() => setMode("new")}
                      className="font-semibold text-[#E43125] hover:underline"
                    >
                      Someone new
                    </button>{" "}
                    if they are not on file yet.
                  </p>
                ) : (
                  <ul>
                    {matches.map((m) => {
                      const already = taken.has(m.fullname.trim().toLowerCase());
                      const isSelected = form.userId === m.id;
                      return (
                        <li key={m.id}>
                          <button
                            onClick={() => !already && pick(m)}
                            disabled={already}
                            className={`flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2.5 text-left last:border-b-0 transition ${
                              already
                                ? "cursor-not-allowed opacity-45"
                                : isSelected
                                  ? "bg-[#fff5f4]"
                                  : "hover:bg-gray-50"
                            }`}
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                isSelected
                                  ? "bg-[#E43125] text-white"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {isSelected ? (
                                <Check size={14} />
                              ) : (
                                m.fullname.trim().charAt(0).toUpperCase()
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-gray-900">
                                {m.fullname}
                              </span>
                              <span className="block truncate text-xs text-gray-500">
                                {m.parent_name ? `${m.parent_name} · ` : ""}
                                {ageFrom(m.dateOfBirth)}
                              </span>
                            </span>
                            {already && (
                              <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                                ALREADY IN
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {selected && (
                <div className="mt-3 rounded-xl bg-[#fff5f4] p-3 text-sm">
                  <p className="font-semibold text-gray-900">
                    {selected.fullname}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selected.email} · {selected.phone_number || "no phone"} ·{" "}
                    {ageFrom(selected.dateOfBirth)}
                  </p>
                  {!selected.dateOfBirth && (
                    <p className="mt-1 text-xs font-semibold text-amber-700">
                      No date of birth on file — add it below, the league
                      requires it.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Once a member is chosen the fields are prefilled and only there to
              be checked. For someone new they are the whole form. */}
          {(mode === "new" || form.userId) && (
            <>
              <div>
                <p className={section}>
                  {form.userId ? "Check these" : "Player"}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="reg-first">
                      First name
                    </label>
                    <input
                      id="reg-first"
                      value={form.firstName}
                      onChange={(e) => set({ firstName: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="reg-last">
                      Last name
                    </label>
                    <input
                      id="reg-last"
                      value={form.lastName}
                      onChange={(e) => set({ lastName: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="reg-dob">
                      Date of birth
                    </label>
                    <input
                      id="reg-dob"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => set({ dateOfBirth: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label} htmlFor="reg-age">
                        Age group
                      </label>
                      <select
                        id="reg-age"
                        value={form.ageGroup}
                        onChange={(e) => set({ ageGroup: e.target.value })}
                        className={field}
                      >
                        <option value="">Choose…</option>
                        {ageGroups.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label} htmlFor="reg-gender">
                        Gender
                      </label>
                      <select
                        id="reg-gender"
                        value={form.gender}
                        onChange={(e) => set({ gender: e.target.value })}
                        className={field}
                      >
                        {GENDERS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                {form.dateOfBirth && form.ageGroup && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    {form.ageGroup} suggested from their birth year — change it
                    if the league has them elsewhere.
                  </p>
                )}
              </div>

              <div>
                <p className={section}>Contact</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="reg-email">
                      Email
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set({ email: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="reg-phone">
                      Phone
                    </label>
                    <input
                      id="reg-phone"
                      value={form.phone}
                      onChange={(e) => set({ phone: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label} htmlFor="reg-parent">
                      Parent / guardian
                    </label>
                    <input
                      id="reg-parent"
                      value={form.parentName}
                      onChange={(e) => set({ parentName: e.target.value })}
                      className={field}
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className={section}>
                  Address {form.userId ? "" : "— required by the league"}
                </p>
                {form.userId && (
                  <p className="mb-2 text-xs text-gray-500">
                    Leave blank to use the address already on this player&apos;s
                    record. Only fill these in if the league says something is
                    missing.
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={label} htmlFor="reg-addr">
                      Street address
                    </label>
                    <input
                      id="reg-addr"
                      value={form.address1}
                      onChange={(e) => set({ address1: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="reg-city">
                      City
                    </label>
                    <input
                      id="reg-city"
                      value={form.city}
                      onChange={(e) => set({ city: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label} htmlFor="reg-prov">
                        Province
                      </label>
                      <input
                        id="reg-prov"
                        value={form.province}
                        onChange={(e) => set({ province: e.target.value })}
                        className={field}
                      />
                    </div>
                    <div>
                      <label className={label} htmlFor="reg-postal">
                        Postal code
                      </label>
                      <input
                        id="reg-postal"
                        value={form.postalCode}
                        onChange={(e) => set({ postalCode: e.target.value })}
                        className={field}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                <div>
                  <label className={label} htmlFor="reg-medical">
                    Medical notes{" "}
                    <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="reg-medical"
                    value={form.medicalNotes}
                    onChange={(e) => set({ medicalNotes: e.target.value })}
                    placeholder="Allergies, asthma, medication"
                    className={field}
                  />
                </div>
                <div>
                  <label className={label} htmlFor="reg-note">
                    Why you are adding this by hand{" "}
                    <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="reg-note"
                    value={form.adminNote}
                    onChange={(e) => set({ adminNote: e.target.value })}
                    placeholder="Paid $450 by e-transfer on Aug 20"
                    className={field}
                  />
                </div>

                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.payInFull}
                    onChange={(e) => set({ payInFull: e.target.checked })}
                    className="mt-0.5"
                  />
                  <span>
                    Paying the whole season at once
                    <span className="block text-xs text-gray-500">
                      Charges the single pay-in-full rate instead of two
                      installments.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.sendEmail}
                    onChange={(e) => set({ sendEmail: e.target.checked })}
                    className="mt-0.5"
                  />
                  <span>
                    Email the family a confirmation
                    <span className="block text-xs text-gray-500">
                      Turn this off if they already registered somewhere else
                      and a second confirmation would confuse them.
                    </span>
                  </span>
                </label>
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-5">
          <p className="text-xs text-gray-500">
            The spot is held once you record the first payment.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={isSaving || (mode === "member" && !form.userId)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c4291f] disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <UserPlus size={15} />
              )}
              Add registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRegistrationDialog;
