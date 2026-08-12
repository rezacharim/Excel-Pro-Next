/** An admin account as returned by the API — passwords are never included. */
export type AdminAccountStatus = "active" | "locked" | "disabled";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  account_status: AdminAccountStatus;
  last_login: string | null;
  createdAt: string;
}

/** POST /admin */
export interface CreateAdminDto {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

/** PATCH /admin/:id — every field optional */
export interface UpdateAdminDto {
  email?: string;
  first_name?: string;
  last_name?: string;
  account_status?: AdminAccountStatus;
}

/** POST /admin/:id/reset-password */
export interface ResetPasswordDto {
  password: string;
}

/**
 * A password shown to the owner exactly once, right after it is created or
 * reset — it can never be read back from the server afterwards.
 */
export interface OneTimeCredentials {
  heading: string;
  username: string;
  password: string;
}

export interface AdminFormValues {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}
