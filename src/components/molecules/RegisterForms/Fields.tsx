import { ChangeEvent, FocusEvent, ReactNode } from "react";

/**
 * Shared field primitives for the 3-step registration wizard.
 *
 * The wizard is filled almost entirely on phones, so every control is
 * full-width and at least 44px tall (Apple/Android minimum touch target), the
 * label stays visible above the input instead of living in the placeholder,
 * and errors are linked to their input with aria-describedby.
 */

const controlClasses =
  "w-full min-h-[44px] rounded-md border px-3 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#E43125]/40 focus:border-[#E43125] disabled:bg-gray-100 disabled:text-gray-500";

const borderClasses = (hasError: boolean) =>
  hasError ? "border-red-500" : "border-gray-300";

type FieldShellProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
};

const FieldShell = ({
  id,
  label,
  required,
  error,
  hint,
  children,
}: FieldShellProps) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-800 mb-1.5"
    >
      {label}
      {required && (
        <span className="text-[#E43125]" aria-hidden="true">
          {" "}
          *
        </span>
      )}
    </label>
    {children}
    {hint && (
      <p id={`${id}-hint`} className="mt-1 text-xs text-gray-500">
        {hint}
      </p>
    )}
    {error && (
      <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600">
        {error}
      </p>
    )}
  </div>
);

const describedBy = (id: string, hasHint: boolean, hasError: boolean) => {
  const ids = [
    hasHint ? `${id}-hint` : null,
    hasError ? `${id}-error` : null,
  ].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
};

type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  type?: "text" | "tel" | "email" | "date";
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  max?: string;
  error?: string;
  hint?: ReactNode;
};

export const TextField = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  required,
  disabled,
  readOnly,
  max,
  error,
  hint,
}: TextFieldProps) => (
  <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
    <input
      id={id}
      name={name}
      type={type}
      inputMode={inputMode}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      max={max}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy(id, Boolean(hint), Boolean(error))}
      className={`${controlClasses} ${borderClasses(Boolean(error))} ${
        readOnly ? "bg-gray-100 text-gray-600" : ""
      }`}
    />
  </FieldShell>
);

type SelectFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: FocusEvent<HTMLSelectElement>) => void;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
};

export const SelectField = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  required,
  error,
  hint,
  children,
}: SelectFieldProps) => (
  <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy(id, Boolean(hint), Boolean(error))}
      className={`${controlClasses} ${borderClasses(Boolean(error))}`}
    >
      {children}
    </select>
  </FieldShell>
);

type TextareaFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
};

export const TextareaField = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  rows = 4,
  maxLength,
  placeholder,
  required,
  error,
  hint,
}: TextareaFieldProps) => (
  <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
    <textarea
      id={id}
      name={name}
      rows={rows}
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy(id, Boolean(hint), Boolean(error))}
      className={`${controlClasses} resize-y ${borderClasses(Boolean(error))}`}
    />
    {maxLength && (
      <p className="mt-1 text-xs text-gray-400 text-right">
        {value.length}/{maxLength}
      </p>
    )}
  </FieldShell>
);

/** Shared submit button styling for the wizard's "Next"/"Complete" buttons. */
export const submitButtonClasses = (disabled: boolean) =>
  `w-full min-h-[48px] rounded-md font-semibold text-white transition-colors ${
    disabled
      ? "bg-[#E43125]/50 cursor-not-allowed"
      : "bg-[#E43125] hover:bg-[#c9281e]"
  }`;
