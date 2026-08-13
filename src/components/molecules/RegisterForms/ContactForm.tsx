import { NextPage } from "next";
import { Button } from "@/components/atoms/Button/Button";
import { useRegisterStepStore } from "@/stores/registerStepStore";
import useUserFormStore from "@/stores/UserFormStore";
import { useFormik } from "formik";
import * as Yup from "yup";
import { TextField, submitButtonClasses } from "./Fields";

/**
 * Deliberately forgiving: parents type "(416) 555-0123", "416-555-0123" or
 * "+1 416 555 0123" and all of them are the same number. We only insist on a
 * plausible 10-digit Canadian number once the formatting is stripped out.
 */
const digitsOnly = (value: string) => value.replace(/\D/g, "");

const isPlausiblePhone = (value?: string) => {
  const digits = digitsOnly(value || "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
};

/** Store phones in one canonical shape (+1XXXXXXXXXX) for the backend. */
const normalizePhone = (value: string) => {
  const digits = digitsOnly(value);
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return local.length === 10 ? `+1${local}` : value.trim();
};

// A1A 1A1, with or without the space/dash, upper or lower case.
const POSTAL_CODE_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

const validationSchema = Yup.object({
  parent_name: Yup.string()
    .trim()
    .required("Please enter the parent or guardian's name")
    .max(200, "Please use 200 characters or fewer"),
  phone_number: Yup.string()
    .required("Please enter a phone number we can reach you on")
    .test("phone", "Please enter a 10-digit phone number, e.g. 416 555 0123", (v) =>
      isPlausiblePhone(v)
    ),
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Please enter an email address"),
  address: Yup.string()
    .trim()
    .required("Please enter your street address")
    .max(500, "Please use 500 characters or fewer"),
  city: Yup.string()
    .trim()
    .required("Please enter your city")
    .max(100, "Please use 100 characters or fewer"),
  postalCode: Yup.string()
    .required("Please enter your postal code")
    .test("postal", "Please enter a postal code like M5V 2T6", (v) =>
      POSTAL_CODE_REGEX.test((v || "").trim())
    ),
  emergencyContactName: Yup.string()
    .trim()
    .required("Please enter an emergency contact name")
    .max(200, "Please use 200 characters or fewer"),
  emergencyPhone: Yup.string()
    .required("Please enter an emergency phone number")
    .test("phone", "Please enter a 10-digit phone number, e.g. 416 555 0123", (v) =>
      isPlausiblePhone(v)
    ),
});

const ParentAndContactForm: NextPage = () => {
  const { setStep, step } = useRegisterStepStore();
  const {
    parent_name,
    phone_number,
    email,
    emailVerified,
    address,
    postalCode,
    city,
    emergencyContactName,
    emergencyPhone,
    setParentName,
    setPhoneNumber,
    setEmail,
    setAddress,
    setPostalCode,
    setCity,
    setEmergencyContactName,
    setEmergencyPhone,
  } = useUserFormStore();

  // Ticked by default (the common case), but a parent coming back to this step
  // keeps whatever separate emergency contact they already entered.
  const startsSameAsParent =
    (!emergencyContactName && !emergencyPhone) ||
    (emergencyContactName === parent_name && emergencyPhone === phone_number);

  const formik = useFormik({
    initialValues: {
      parent_name: parent_name || "",
      phone_number: phone_number || "",
      email: email || "",
      address: address || "",
      city: city || "",
      postalCode: postalCode || "",
      emergencyContactName: startsSameAsParent
        ? parent_name || ""
        : emergencyContactName,
      emergencyPhone: startsSameAsParent ? phone_number || "" : emergencyPhone,
      sameAsParent: startsSameAsParent,
    },
    validationSchema,
    onSubmit: (values) => {
      setParentName(values.parent_name.trim());
      setPhoneNumber(normalizePhone(values.phone_number));
      setEmail(values.email);
      setAddress(values.address.trim());
      setCity(values.city.trim());
      setPostalCode(values.postalCode.trim().toUpperCase());
      setEmergencyContactName(values.emergencyContactName.trim());
      setEmergencyPhone(normalizePhone(values.emergencyPhone));
      setStep(step + 1);
    },
  });

  const { sameAsParent } = formik.values;

  const errorFor = (field: keyof typeof formik.values) =>
    formik.touched[field] ? (formik.errors[field] as string | undefined) : undefined;

  // While "same as parent/guardian" is ticked the emergency fields shadow the
  // parent's details, so editing the parent above keeps them in sync.
  const handleParentNameChange = (value: string) => {
    formik.setFieldValue("parent_name", value);
    if (sameAsParent) formik.setFieldValue("emergencyContactName", value);
  };

  const handleParentPhoneChange = (value: string) => {
    formik.setFieldValue("phone_number", value);
    if (sameAsParent) formik.setFieldValue("emergencyPhone", value);
  };

  const handleSameAsParentChange = (checked: boolean) => {
    formik.setFieldValue("sameAsParent", checked);
    if (checked) {
      formik.setFieldValue("emergencyContactName", formik.values.parent_name);
      formik.setFieldValue("emergencyPhone", formik.values.phone_number);
    } else {
      // Cleared so the parent types a genuinely different contact.
      formik.setFieldValue("emergencyContactName", "");
      formik.setFieldValue("emergencyPhone", "");
    }
  };

  return (
    <div className="mb-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Parent &amp; contact</h1>
      <p className="text-gray-600 mb-6 text-sm">
        How we reach you, and who we call if something happens at training.
      </p>

      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-5">
          <TextField
            id="parent_name"
            name="parent_name"
            label="Parent/guardian name"
            required
            type="text"
            autoComplete="name"
            placeholder="Example: Jane Smith"
            value={formik.values.parent_name}
            onChange={(e) => handleParentNameChange(e.target.value)}
            onBlur={formik.handleBlur}
            error={errorFor("parent_name")}
          />

          <TextField
            id="phone_number"
            name="phone_number"
            label="Parent phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Example: 416 555 0123"
            value={formik.values.phone_number}
            onChange={(e) => handleParentPhoneChange(e.target.value)}
            onBlur={formik.handleBlur}
            error={errorFor("phone_number")}
          />

          <TextField
            id="email"
            name="email"
            label="Parent email"
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Example: email@example.com"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            readOnly={emailVerified}
            hint={emailVerified ? "✓ Verified email address" : undefined}
            error={errorFor("email")}
          />

          <TextField
            id="address"
            name="address"
            label="Street address"
            required
            type="text"
            autoComplete="street-address"
            placeholder="Example: 123 Main Street, Apt 4B"
            value={formik.values.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={errorFor("address")}
          />

          <TextField
            id="city"
            name="city"
            label="City"
            required
            type="text"
            autoComplete="address-level2"
            placeholder="Example: Markham"
            value={formik.values.city}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={errorFor("city")}
          />

          <TextField
            id="postalCode"
            name="postalCode"
            label="Postal code"
            required
            type="text"
            autoComplete="postal-code"
            placeholder="Example: M5V 2T6"
            value={formik.values.postalCode}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={errorFor("postalCode")}
          />

          <div className="pt-2">
            <h2 className="text-lg font-semibold mb-3">Emergency contact</h2>

            <div className="flex items-center mb-4">
              <input
                id="sameAsParent"
                name="sameAsParent"
                type="checkbox"
                checked={sameAsParent}
                onChange={(e) => handleSameAsParentChange(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-[#E43125] focus:ring-[#E43125]"
              />
              <label
                htmlFor="sameAsParent"
                className="ml-2 text-sm font-medium text-gray-800"
              >
                Same as parent/guardian
              </label>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <TextField
                id="emergencyContactName"
                name="emergencyContactName"
                label="Emergency contact name"
                required
                type="text"
                placeholder="Example: John Doe"
                value={formik.values.emergencyContactName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={sameAsParent}
                error={errorFor("emergencyContactName")}
              />

              <TextField
                id="emergencyPhone"
                name="emergencyPhone"
                label="Emergency phone"
                required
                type="tel"
                inputMode="tel"
                placeholder="Example: 416 555 0123"
                value={formik.values.emergencyPhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={sameAsParent}
                error={errorFor("emergencyPhone")}
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Button
            type="submit"
            className={submitButtonClasses(formik.isSubmitting)}
            disabled={formik.isSubmitting}
          >
            Next step
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ParentAndContactForm;
