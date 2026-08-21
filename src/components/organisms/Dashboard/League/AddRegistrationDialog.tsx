"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

export interface AddRegistrationPayload {
  ageGroup: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
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

/**
 * Adding a player to the league roster by hand.
 *
 * Needed because registrations could only ever arrive through the public form
 * or the parent portal. A family who signed up on the phone, or paid by
 * e-transfer, or went through the membership flow by mistake, could not be put
 * on the roster at all — the admin had to fill in the public form pretending
 * to be them.
 *
 * Every field the league's import sheet requires is asked for here, because a
 * roster row missing a date of birth or a postal code is rejected at filing
 * time, which is the worst possible moment to find out.
 */
const AddRegistrationDialog = ({
  open,
  ageGroups,
  seasonName,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  ageGroups: string[];
  seasonName: string;
  onCancel: () => void;
  onSubmit: (payload: AddRegistrationPayload) => Promise<void>;
}) => {
  const [form, setForm] = useState<AddRegistrationPayload>({
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
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm((f) => ({ ...f, ageGroup: f.ageGroup || ageGroups[0] || "U13" }));
  }, [open, ageGroups]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  if (!open) return null;

  const set = <K extends keyof AddRegistrationPayload>(
    key: K,
    value: AddRegistrationPayload[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  // Mirrors what the backend insists on, so the common mistakes are caught
  // before a round trip.
  const missing = [
    !form.ageGroup && "age group",
    !form.firstName.trim() && "first name",
    !form.lastName.trim() && "last name",
    !form.dateOfBirth && "date of birth",
    !form.email.trim() && "email",
    !form.phone.trim() && "phone",
    !form.address1.trim() && "address",
    !form.city.trim() && "city",
    !form.postalCode.trim() && "postal code",
  ].filter(Boolean) as string[];

  const save = async () => {
    if (missing.length) {
      setError(`Still needed: ${missing.join(", ")}.`);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        address1: form.address1.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        parentName: form.parentName?.trim() || undefined,
        medicalNotes: form.medicalNotes?.trim() || undefined,
        adminNote: form.adminNote?.trim() || undefined,
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-4 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add a registration</h2>
            <p className="mt-0.5 text-sm text-gray-600">
              {seasonName || "Active season"} — for a family who signed up by
              phone, by e-transfer, or through the wrong form
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

        <div className="space-y-5 p-5">
          {/* ---- player ---- */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Player
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="reg-first">
                  First name
                </label>
                <input
                  id="reg-first"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
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
                  onChange={(e) => set("lastName", e.target.value)}
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
                  onChange={(e) => set("dateOfBirth", e.target.value)}
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
                    onChange={(e) => set("ageGroup", e.target.value)}
                    className={field}
                  >
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
                    onChange={(e) => set("gender", e.target.value)}
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
          </div>

          {/* ---- contact ---- */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Contact
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="reg-email">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={field}
                />
                <p className="mt-1 text-xs text-gray-500">
                  If this family is already on file, this links to their record
                  instead of creating a duplicate.
                </p>
              </div>
              <div>
                <label className={label} htmlFor="reg-phone">
                  Phone
                </label>
                <input
                  id="reg-phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={field}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="reg-parent">
                  Parent / guardian{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="reg-parent"
                  value={form.parentName}
                  onChange={(e) => set("parentName", e.target.value)}
                  className={field}
                />
              </div>
            </div>
          </div>

          {/* ---- address: the league sheet rejects rows without it ---- */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Address — required by the league
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label} htmlFor="reg-addr">
                  Street address
                </label>
                <input
                  id="reg-addr"
                  value={form.address1}
                  onChange={(e) => set("address1", e.target.value)}
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
                  onChange={(e) => set("city", e.target.value)}
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
                    onChange={(e) => set("province", e.target.value)}
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
                    onChange={(e) => set("postalCode", e.target.value)}
                    className={field}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ---- admin ---- */}
          <div className="space-y-3 rounded-xl bg-gray-50 p-4">
            <div>
              <label className={label} htmlFor="reg-medical">
                Medical notes{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="reg-medical"
                value={form.medicalNotes}
                onChange={(e) => set("medicalNotes", e.target.value)}
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
                onChange={(e) => set("adminNote", e.target.value)}
                placeholder="Paid $455 by e-transfer on Aug 20"
                className={field}
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.payInFull}
                onChange={(e) => set("payInFull", e.target.checked)}
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
                onChange={(e) => set("sendEmail", e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Email the family a confirmation
                <span className="block text-xs text-gray-500">
                  Turn this off if they already registered somewhere else and a
                  second confirmation would confuse them.
                </span>
              </span>
            </label>
          </div>

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
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#E43125] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c4291f] disabled:opacity-50"
            >
              {isSaving && <Loader2 size={15} className="animate-spin" />}
              Add registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRegistrationDialog;
