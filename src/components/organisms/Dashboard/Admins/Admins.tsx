"use client";

import { NextPage } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  UserCog,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  AdminAccountStatus,
  AdminFormValues,
  AdminUser,
  CreateAdminDto,
  OneTimeCredentials,
  UpdateAdminDto,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** The API rejects anything shorter, so the UI checks for it up front. */
const MIN_PASSWORD_LENGTH = 10;
const GENERATED_PASSWORD_LENGTH = 16;

const SESSION_EXPIRED = "Your session expired — please sign in again.";

/**
 * Characters used for suggested passwords. Look-alike characters (0/O, 1/l/I)
 * are left out on purpose: these credentials get typed by hand or read out
 * over the phone when the owner hands an account to his director.
 */
const PASSWORD_ALPHABET =
  "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?";

type ModalType = "create" | "edit" | "reset" | "delete";

interface ToastState {
  kind: "success" | "error";
  message: string;
}

const EMPTY_FORM: AdminFormValues = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

/**
 * A cryptographically random password. Math.random is never used here — these
 * passwords protect full access to the dashboard.
 */
const generatePassword = (length = GENERATED_PASSWORD_LENGTH): string => {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += PASSWORD_ALPHABET.charAt(values[i] % PASSWORD_ALPHABET.length);
  }
  return result;
};

const fullName = (admin: AdminUser): string => {
  const name = `${admin.first_name || ""} ${admin.last_name || ""}`.trim();
  if (name) return name;
  return admin.username || "Unnamed admin";
};

const initials = (admin: AdminUser): string => {
  const first = (admin.first_name || "").trim().charAt(0);
  const last = (admin.last_name || "").trim().charAt(0);
  const letters = `${first}${last}`.trim();
  if (letters) return letters.toUpperCase();
  return (admin.username || "A").charAt(0).toUpperCase();
};

/** Empty string when the admin has never signed in, so the row can say so. */
const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Admins: NextPage = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [targetAdmin, setTargetAdmin] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<AdminFormValues>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Shown once after a create or a reset; the password cannot be read back.
  const [credentials, setCredentials] = useState<OneTimeCredentials | null>(
    null
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const savedToken = Cookies.get("auth_token");

  const showToast = useCallback((kind: "success" | "error", message: string) => {
    setToast({ kind, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!copiedField) return;
    const timer = setTimeout(() => setCopiedField(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedField]);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoadError(null);
      const headers = { Authorization: `Bearer ${savedToken}` };
      const [listResponse, meResponse] = await Promise.all([
        fetch(`${API_URL}/admin`, { headers }),
        fetch(`${API_URL}/admin/me`, { headers }),
      ]);

      if (listResponse.status === 401 || meResponse.status === 401) {
        setLoadError(SESSION_EXPIRED);
        return;
      }
      if (!listResponse.ok) {
        throw new Error("Failed to load admin users");
      }

      const data: unknown = await listResponse.json();
      setAdmins(Array.isArray(data) ? (data as AdminUser[]) : []);

      if (meResponse.ok) {
        const me: Partial<AdminUser> = await meResponse.json();
        setCurrentAdminId(typeof me?.id === "number" ? me.id : null);
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
      setLoadError("Failed to load admin users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [savedToken]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const counts = useMemo(() => {
    const active = admins.filter((a) => a.account_status === "active").length;
    const locked = admins.filter((a) => a.account_status === "locked").length;
    const disabled = admins.filter(
      (a) => a.account_status === "disabled"
    ).length;
    return { total: admins.length, active, locked, disabled };
  }, [admins]);

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setModalType(null);
    setTargetAdmin(null);
    setForm(EMPTY_FORM);
    setDeleteConfirmation("");
    setFormError(null);
    setShowPassword(false);
  }, [isSubmitting]);

  // Escape closes the top-most layer first: the credentials panel sits above
  // the form modal that produced it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (credentials) {
        setCredentials(null);
        return;
      }
      if (modalType) closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [credentials, modalType, closeModal]);

  const openCreateModal = () => {
    setTargetAdmin(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowPassword(false);
    setModalType("create");
  };

  const openEditModal = (admin: AdminUser) => {
    setTargetAdmin(admin);
    setForm({
      ...EMPTY_FORM,
      first_name: admin.first_name || "",
      last_name: admin.last_name || "",
      username: admin.username || "",
      email: admin.email || "",
    });
    setFormError(null);
    setModalType("edit");
  };

  const openResetModal = (admin: AdminUser) => {
    setTargetAdmin(admin);
    setForm({ ...EMPTY_FORM, username: admin.username || "" });
    setFormError(null);
    setShowPassword(false);
    setModalType("reset");
  };

  const openDeleteModal = (admin: AdminUser) => {
    setTargetAdmin(admin);
    setDeleteConfirmation("");
    setFormError(null);
    setModalType("delete");
  };

  /** Turns a failed response into the clearest message we can show. */
  const readErrorMessage = async (
    response: Response,
    fallback: string
  ): Promise<string> => {
    if (response.status === 401) return SESSION_EXPIRED;
    try {
      const data = await response.json();
      const message = Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message;
      if (typeof message === "string" && message.trim()) return message;
    } catch {
      // keep the fallback
    }
    return fallback;
  };

  const request = async (
    path: string,
    init: RequestInit,
    fallbackError: string
  ): Promise<unknown> => {
    const response = await fetch(`${API_URL}/admin${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${savedToken}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, fallbackError));
    }
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const copyToClipboard = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
    } catch {
      showToast("error", "Could not copy — please select the text manually.");
    }
  };

  const suggestPassword = () => {
    const generated = generatePassword();
    setForm((previous) => ({
      ...previous,
      password: generated,
      confirmPassword: generated,
    }));
    setShowPassword(true);
  };

  const passwordChecks = useMemo(
    () => [
      {
        label: `At least ${MIN_PASSWORD_LENGTH} characters`,
        passed: form.password.length >= MIN_PASSWORD_LENGTH,
      },
      {
        label: "Passwords match",
        passed:
          form.password.length > 0 && form.password === form.confirmPassword,
      },
    ],
    [form.password, form.confirmPassword]
  );

  const passwordIsValid = passwordChecks.every((check) => check.passed);

  const createIsValid =
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    form.username.trim().length > 0 &&
    form.email.trim().length > 0 &&
    passwordIsValid;

  const submitCreate = async () => {
    if (!createIsValid) {
      setFormError("Please fill in every field and check the password rules.");
      return;
    }
    const body: CreateAdminDto = {
      username: form.username.trim(),
      email: form.email.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      password: form.password,
    };
    try {
      setIsSubmitting(true);
      setFormError(null);
      await request(
        "",
        { method: "POST", body: JSON.stringify(body) },
        "Could not create the admin account"
      );
      setCredentials({
        heading: `${body.first_name} ${body.last_name} can now sign in`.trim(),
        username: body.username,
        password: body.password,
      });
      setModalType(null);
      setTargetAdmin(null);
      setForm(EMPTY_FORM);
      await fetchAdmins();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!targetAdmin) return;
    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.email.trim()
    ) {
      setFormError("Name and email cannot be empty.");
      return;
    }
    const body: UpdateAdminDto = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
    };
    try {
      setIsSubmitting(true);
      setFormError(null);
      await request(
        `/${targetAdmin.id}`,
        { method: "PATCH", body: JSON.stringify(body) },
        "Could not save the changes"
      );
      showToast("success", `Details updated for ${fullName(targetAdmin)}`);
      setModalType(null);
      setTargetAdmin(null);
      setForm(EMPTY_FORM);
      await fetchAdmins();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReset = async () => {
    if (!targetAdmin) return;
    if (!passwordIsValid) {
      setFormError("Please check the password rules below.");
      return;
    }
    const newPassword = form.password;
    try {
      setIsSubmitting(true);
      setFormError(null);
      await request(
        `/${targetAdmin.id}/reset-password`,
        { method: "POST", body: JSON.stringify({ password: newPassword }) },
        "Could not reset the password"
      );
      setCredentials({
        heading: `New password for ${fullName(targetAdmin)}`,
        username: targetAdmin.username || "",
        password: newPassword,
      });
      setModalType(null);
      setTargetAdmin(null);
      setForm(EMPTY_FORM);
      await fetchAdmins();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDelete = async () => {
    if (!targetAdmin) return;
    try {
      setIsSubmitting(true);
      setFormError(null);
      await request(
        `/${targetAdmin.id}`,
        { method: "DELETE" },
        "Could not delete this account"
      );
      showToast("success", `${fullName(targetAdmin)} was removed`);
      setModalType(null);
      setTargetAdmin(null);
      setDeleteConfirmation("");
      await fetchAdmins();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const runRowAction = async (
    admin: AdminUser,
    path: string,
    init: RequestInit,
    successMessage: string,
    fallbackError: string
  ) => {
    try {
      setBusyId(admin.id);
      await request(path, init, fallbackError);
      showToast("success", successMessage);
      await fetchAdmins();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setBusyId(null);
    }
  };

  const unlockAdmin = (admin: AdminUser) =>
    runRowAction(
      admin,
      `/${admin.id}/unlock`,
      { method: "POST" },
      `${fullName(admin)} can sign in again`,
      "Could not unlock this account"
    );

  const toggleEnabled = (admin: AdminUser) => {
    const nextStatus: AdminAccountStatus =
      admin.account_status === "disabled" ? "active" : "disabled";
    const body: UpdateAdminDto = { account_status: nextStatus };
    return runRowAction(
      admin,
      `/${admin.id}`,
      { method: "PATCH", body: JSON.stringify(body) },
      nextStatus === "disabled"
        ? `${fullName(admin)} can no longer sign in`
        : `${fullName(admin)} can sign in again`,
      nextStatus === "disabled"
        ? "Could not disable this account"
        : "Could not enable this account"
    );
  };

  const renderStatusBadge = (status: AdminAccountStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 size={12} />
            Active
          </span>
        );
      case "locked":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Lock size={12} />
            Locked
          </span>
        );
      case "disabled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
            <Ban size={12} />
            Disabled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Unknown
          </span>
        );
    }
  };

  const summaryCards = [
    {
      label: "Admins",
      value: counts.total,
      icon: <Users className="w-5 h-5 text-blue-600" />,
      iconBg: "bg-blue-100",
    },
    {
      label: "Active",
      value: counts.active,
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      iconBg: "bg-green-100",
    },
    {
      label: "Locked",
      value: counts.locked,
      icon: <Lock className="w-5 h-5 text-amber-600" />,
      iconBg: "bg-amber-100",
    },
    {
      label: "Disabled",
      value: counts.disabled,
      icon: <Ban className="w-5 h-5 text-gray-500" />,
      iconBg: "bg-gray-100",
    },
  ];

  const isPasswordModal = modalType === "create" || modalType === "reset";

  const copyButton = (value: string, field: string, label: string) => (
    <button
      type="button"
      onClick={() => copyToClipboard(value, field)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium"
      aria-label={label}
    >
      {copiedField === field ? (
        <>
          <Check size={14} className="text-green-600" />
          Copied
        </>
      ) : (
        <>
          <Copy size={14} />
          Copy
        </>
      )}
    </button>
  );

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen rounded-lg">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Admin Users</h1>
          <p className="text-gray-500 text-sm md:text-base max-w-2xl">
            Everyone listed here can sign in to this dashboard and has full
            access — payments, memberships, messages and settings. Only add
            people you trust.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] transition-colors text-sm font-medium shrink-0"
        >
          <Plus size={16} />
          Add admin
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}
            >
              {card.icon}
            </div>
            <div>
              <div className="text-2xl font-bold leading-tight">
                {isLoading ? "—" : card.value}
              </div>
              <div className="text-gray-500 text-xs md:text-sm">
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plain-language explanation of the lockout rule */}
      <div className="mb-6 flex items-start gap-2 text-xs md:text-sm text-gray-500">
        <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />
        <p>
          An account locks itself after 5 wrong passwords. Use Unlock to restore
          access.
        </p>
      </div>

      {/* Admin list */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12 bg-white border border-gray-200 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading admin users...</span>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white border border-gray-200 rounded-lg">
          <XCircle className="w-10 h-10 text-red-500 mb-3" />
          <p className="text-gray-700 mb-4">{loadError}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              fetchAdmins();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#E43125] text-white rounded-lg hover:bg-[#c9281e] text-sm"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      ) : admins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white border border-gray-200 rounded-lg">
          <UserCog className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500">No admin accounts yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => {
            const isSelf =
              currentAdminId !== null && admin.id === currentAdminId;
            const isBusy = busyId === admin.id;
            const isDisabled = admin.account_status === "disabled";
            const name = fullName(admin);

            return (
              <div
                key={admin.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col lg:flex-row lg:items-center gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 ${
                      isDisabled ? "bg-gray-400" : "bg-blue-500"
                    }`}
                    aria-hidden="true"
                  >
                    {initials(admin)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm md:text-base">
                        {name}
                      </span>
                      {isSelf && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          You
                        </span>
                      )}
                      {renderStatusBadge(admin.account_status)}
                    </div>
                    <div className="text-gray-500 text-xs md:text-sm mt-1 break-words">
                      @{admin.username || "unknown"}
                      {admin.email ? ` · ${admin.email}` : ""}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {formatDateTime(admin.last_login)
                        ? `Last signed in ${formatDateTime(admin.last_login)}`
                        : "Has not signed in yet"}
                    </div>
                  </div>
                </div>

                {/* Inline actions — kept in the flow of the card so they can
                    never be clipped by a scroll container. */}
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {isBusy && (
                    <Loader2
                      className="animate-spin text-gray-400"
                      size={16}
                      aria-hidden="true"
                    />
                  )}
                  <button
                    onClick={() => openEditModal(admin)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium disabled:opacity-60"
                  >
                    <Pencil size={14} />
                    Edit details
                  </button>
                  <button
                    onClick={() => openResetModal(admin)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium disabled:opacity-60"
                  >
                    <KeyRound size={14} />
                    Reset password
                  </button>
                  {admin.account_status === "locked" && (
                    <button
                      onClick={() => unlockAdmin(admin)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-medium disabled:opacity-60"
                    >
                      <Unlock size={14} />
                      Unlock
                    </button>
                  )}
                  <button
                    onClick={() => toggleEnabled(admin)}
                    disabled={isBusy || isSelf}
                    title={
                      isSelf ? "You cannot disable your own account" : undefined
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium disabled:opacity-60"
                  >
                    {isDisabled ? (
                      <>
                        <PlayCircle size={14} className="text-green-600" />
                        Enable
                      </>
                    ) : (
                      <>
                        <Ban size={14} />
                        Disable
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => openDeleteModal(admin)}
                    disabled={isBusy || isSelf}
                    title={
                      isSelf ? "You cannot delete your own account" : undefined
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium disabled:opacity-60"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / edit / reset / delete modal */}
      {modalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={
            modalType === "create"
              ? "Add admin"
              : modalType === "edit"
              ? "Edit admin details"
              : modalType === "reset"
              ? "Reset password"
              : "Delete admin"
          }
        >
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-5 md:p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {modalType === "create" && (
              <>
                <h2 className="text-lg font-bold mb-1">Add admin</h2>
                <p className="text-gray-500 text-sm mb-4">
                  This person will be able to sign in and manage everything in
                  the dashboard.
                </p>
              </>
            )}
            {modalType === "edit" && targetAdmin && (
              <>
                <h2 className="text-lg font-bold mb-1">Edit details</h2>
                <p className="text-gray-500 text-sm mb-4">
                  @{targetAdmin.username || "unknown"}
                </p>
              </>
            )}
            {modalType === "reset" && targetAdmin && (
              <>
                <h2 className="text-lg font-bold mb-1">Reset password</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Set a new password for {fullName(targetAdmin)} (@
                  {targetAdmin.username || "unknown"}). The new password is
                  shown once so you can send it to them.
                </p>
              </>
            )}
            {modalType === "delete" && targetAdmin && (
              <>
                <h2 className="text-lg font-bold mb-1">Delete admin</h2>
                <p className="text-gray-600 text-sm mb-4">
                  This permanently removes the account for{" "}
                  <span className="font-medium">{fullName(targetAdmin)}</span>{" "}
                  (@{targetAdmin.username || "unknown"}). They will not be able
                  to sign in again.
                </p>
              </>
            )}

            <div className="space-y-4">
              {(modalType === "create" || modalType === "edit") && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="admin-first-name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        First name
                      </label>
                      <input
                        id="admin-first-name"
                        type="text"
                        value={form.first_name}
                        onChange={(e) =>
                          setForm({ ...form, first_name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="admin-last-name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Last name
                      </label>
                      <input
                        id="admin-last-name"
                        type="text"
                        value={form.last_name}
                        onChange={(e) =>
                          setForm({ ...form, last_name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="admin-username"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Username
                    </label>
                    <input
                      id="admin-username"
                      type="text"
                      autoComplete="off"
                      value={form.username}
                      disabled={modalType === "edit"}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    {modalType === "edit" && (
                      <p className="text-xs text-gray-400 mt-1">
                        Usernames cannot be changed.
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="admin-email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}

              {isPasswordModal && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <label
                        htmlFor="admin-password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={suggestPassword}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E43125] hover:text-[#c9281e]"
                      >
                        <Sparkles size={14} />
                        Suggest a strong password
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        className="w-full pl-3 pr-20 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1.5 text-gray-400 hover:text-gray-600"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(form.password, "form-password")
                          }
                          disabled={!form.password}
                          className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-40"
                          aria-label="Copy password to clipboard"
                        >
                          {copiedField === "form-password" ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="admin-confirm-password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm password
                    </label>
                    <input
                      id="admin-confirm-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({ ...form, confirmPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <ul className="space-y-1.5">
                    {passwordChecks.map((check) => (
                      <li
                        key={check.label}
                        className={`flex items-center gap-2 text-sm ${
                          check.passed ? "text-green-700" : "text-gray-500"
                        }`}
                      >
                        {check.passed ? (
                          <CheckCircle2 size={16} className="text-green-600" />
                        ) : (
                          <XCircle size={16} className="text-gray-300" />
                        )}
                        {check.label}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {modalType === "delete" && targetAdmin && (
                <div>
                  <label
                    htmlFor="delete-confirmation"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Type{" "}
                    <span className="font-mono font-semibold">
                      {targetAdmin.username || "unknown"}
                    </span>{" "}
                    to confirm
                  </label>
                  <input
                    id="delete-confirmation"
                    type="text"
                    autoComplete="off"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                  />
                </div>
              )}

              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={
                  modalType === "create"
                    ? submitCreate
                    : modalType === "edit"
                    ? submitEdit
                    : modalType === "reset"
                    ? submitReset
                    : submitDelete
                }
                disabled={
                  isSubmitting ||
                  (modalType === "create" && !createIsValid) ||
                  (modalType === "reset" && !passwordIsValid) ||
                  (modalType === "delete" &&
                    deleteConfirmation.trim() !==
                      (targetAdmin?.username || "").trim())
                }
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60 ${
                  modalType === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#E43125] hover:bg-[#c9281e]"
                }`}
              >
                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                {modalType === "create"
                  ? "Create admin"
                  : modalType === "edit"
                  ? "Save changes"
                  : modalType === "reset"
                  ? "Set new password"
                  : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One-time credentials panel */}
      {credentials && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="New sign-in details"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCredentials(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-5 md:p-6">
            <button
              onClick={() => setCredentials(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="text-green-600" size={20} />
              <h2 className="text-lg font-bold">{credentials.heading}</h2>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Send these sign-in details to them now.
            </p>

            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Username</div>
                  <div className="font-mono text-sm break-all">
                    {credentials.username || "—"}
                  </div>
                </div>
                {copyButton(
                  credentials.username,
                  "credentials-username",
                  "Copy username to clipboard"
                )}
              </div>
              <div className="border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Password</div>
                  <div className="font-mono text-sm break-all">
                    {credentials.password || "—"}
                  </div>
                </div>
                {copyButton(
                  credentials.password,
                  "credentials-password",
                  "Copy password to clipboard"
                )}
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>Copy this now — it will not be shown again.</span>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() =>
                  copyToClipboard(
                    `Username: ${credentials.username}\nPassword: ${credentials.password}`,
                    "credentials-both"
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                {copiedField === "credentials-both" ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} />
                )}
                Copy both
              </button>
              <button
                onClick={() => setCredentials(null)}
                className="px-4 py-2 rounded-lg bg-[#E43125] hover:bg-[#c9281e] text-white text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${
            toast.kind === "success" ? "bg-green-600" : "bg-[#E43125]"
          }`}
        >
          {toast.kind === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <XCircle size={18} />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Admins;
