"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NextPage } from "next";
import { Formik, Field, Form, ErrorMessage, FieldProps } from "formik";
import * as Yup from "yup";
import { sendEmailOtp } from "@/services/sendOtpCode";
import { verifyEmailOtp } from "@/services/verifyOtpCode";
import { getUserByEmail } from "@/services/getUserByEmail";
import { CiMail } from "react-icons/ci";
import FloatingLabelInput from "../FloatingLabelInput/FloatingLabelInput";
import useUserFormStore from "@/stores/UserFormStore";
import { useRegisterStepStore } from "@/stores/registerStepStore";
import { useIsFirstRegister } from "@/stores/firstTimeRegister";

// Form Values
interface AuthFormValues {
  email: string;
  otp: string;
}

interface AuthFormProps {
  auth: (state: boolean) => void;
}

interface Feedback {
  type: "error" | "success";
  text: string;
}

// Validation Schema
const validationSchema = Yup.object({
  email: Yup.string()
    .required("Email address is required")
    .email("Please enter a valid email address"),
  otp: Yup.string().when("otpSent", {
    is: true,
    then: (schema) =>
      schema
        .required("Verification code is required")
        .matches(/^\d{6}$/, "Verification code must be 6 digits"),
  }),
});

// Code lifetime matches the backend Redis TTL (10 minutes)
const CODE_LIFETIME_SECONDS = 600;
// Delay before the "Resend Code" button becomes available
const RESEND_DELAY_SECONDS = 60;

const AuthForm: NextPage<AuthFormProps> = ({ auth }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [verifyCountdown, setVerifyCountdown] = useState<number>(0);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpExpired, setOtpExpired] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { setPhoneNumber, setEmail, setEmailVerified, setFullname } =
    useUserFormStore();
  const { setStep } = useRegisterStepStore();
  const { setIsFirstTime } = useIsFirstRegister();

  const initialValues: AuthFormValues = {
    email: "",
    otp: "",
  };

  const handleSendOtp = async (
    email: string,
    setSubmitting: (isSubmitting: boolean) => void
  ) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await sendEmailOtp(email.trim().toLowerCase());
      setFeedback({
        type: "success",
        text: `We emailed a 6-digit code to ${email
          .trim()
          .toLowerCase()}. It may take a minute to arrive — check your spam folder too.`,
      });
      setOtpSent(true);
      setOtpExpired(false);
      setCountdown(RESEND_DELAY_SECONDS);
      setVerifyCountdown(CODE_LIFETIME_SECONDS);

      // Countdown for resend button
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Countdown for verification expiration
      const verifyInterval = setInterval(() => {
        setVerifyCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(verifyInterval);
            setOtpExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFeedback({ type: "error", text: error.message });
      } else {
        setFeedback({ type: "error", text: "An unexpected error occurred." });
      }
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (values: AuthFormValues) => {
    setIsSubmitting(true);
    setFeedback(null);
    const email = values.email.trim().toLowerCase();
    try {
      const res = await verifyEmailOtp(email, values.otp);
      if (res.success) {
        setEmail(email);
        setEmailVerified(true);
        setFeedback({ type: "success", text: "Email verified successfully." });

        // Verifying the email also signs the parent in to the family
        // dashboard (/account) — one code, one session.
        if (res.token) {
          localStorage.setItem("portal_token", res.token);
          localStorage.setItem("portal_email", res.email || email);
        }

        // Existing family? Their players, renewals and payments all live in
        // the family dashboard — send them there instead of a bare payment
        // screen.
        try {
          const userData = await getUserByEmail(email);
          if (userData) {
            setFeedback({
              type: "success",
              text: "Welcome back! Taking you to your family dashboard...",
            });
            setIsFirstTime(userData.subscriptionCounter === 0);
            setEmail(userData.email);
            setFullname(userData.fullname);
            if (userData.phone_number) {
              setPhoneNumber(userData.phone_number);
            }
            router.push("/account");
            return;
          }
          setIsFirstTime(true);
          setStep(1);
          auth(true);
        } catch (error) {
          console.error("Error fetching user data:", error);
          auth(true);
          setStep(1);
        }
      } else {
        setFeedback({ type: "error", text: "Invalid or expired code." });
      }
    } catch {
      setFeedback({ type: "error", text: "Invalid or expired code." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset OTP state
  const handleResetOtp = (
    setFieldValue: (field: string, value: string) => void
  ) => {
    setOtpSent(false);
    setOtpExpired(false);
    setVerifyCountdown(0);
    setCountdown(0);
    setFeedback(null);
    setFieldValue("otp", "");
  };

  // Format countdown to MM:SS
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto">
      <div className="w-full text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Authentication
        </h1>
        <p className="text-gray-600">
          Please enter the parent&apos;s email address to continue the
          registration process. We&apos;ll email you a verification code.
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) =>
          otpSent && !otpExpired
            ? handleVerifyOtp(values)
            : handleSendOtp(values.email, setSubmitting)
        }
      >
        {({ setFieldValue, isValid, dirty, values }) => (
          <Form className="w-full">
            {/* Email Input */}
            <div className="mb-6">
              <Field name="email">
                {({ field }: FieldProps<string, AuthFormValues>) => (
                  <FloatingLabelInput
                    id="email"
                    name="email"
                    label="Parent email address"
                    type="email"
                    value={field.value}
                    onChange={(e) => {
                      // Don't allow changing email after the code is sent unless it expired
                      if (otpSent && !otpExpired) return;
                      setFieldValue("email", e.target.value);
                    }}
                    placeholder="Example: parent@email.com"
                    icon={<CiMail />}
                    iconPosition="left"
                    isFocused={isFocused || field.value.length > 0}
                    onFocus={() => {
                      if (!otpSent || otpExpired) setIsFocused(true);
                    }}
                    onBlur={() => setIsFocused(false)}
                    disabled={otpSent && !otpExpired}
                  />
                )}
              </Field>
              <ErrorMessage
                name="email"
                component="div"
                className="text-red-500 text-sm mt-2"
              />
              {otpSent && (
                <div className="text-gray-500 text-sm mt-2">
                  We emailed a 6-digit code to:{" "}
                  {values.email.trim().toLowerCase()}
                </div>
              )}
            </div>

            {/* OTP Input */}
            {otpSent && (
              <div className="mb-6">
                <Field name="otp">
                  {({ field, form }: FieldProps<string, AuthFormValues>) => {
                    const { onChange, value, name } = field;
                    return (
                      <FloatingLabelInput
                        id="otp"
                        name={name}
                        label="Enter the verification code"
                        type="text"
                        placeholder="6-digit code"
                        isFocused={true}
                        value={value}
                        onChange={onChange}
                        onBlur={() => form.handleBlur({ target: { name } })}
                        disabled={otpExpired}
                      />
                    );
                  }}
                </Field>
                <ErrorMessage
                  name="otp"
                  component="div"
                  className="text-red-500 text-sm mt-2"
                />

                {/* Verification timer display */}
                {verifyCountdown > 0 && (
                  <div className="text-gray-600 text-sm mt-2">
                    Code expires in: {formatCountdown(verifyCountdown)}
                  </div>
                )}

                {/* Code expired message */}
                {otpExpired && (
                  <div className="text-red-500 text-sm mt-2">
                    The code has expired. Please edit your email address or
                    request a new code.
                  </div>
                )}
              </div>
            )}

            {/* Inline feedback (replaces alert()) */}
            {feedback && (
              <div
                className={`${
                  feedback.type === "error"
                    ? "text-red-500"
                    : "text-green-600"
                } text-sm mb-4`}
              >
                {feedback.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isSubmitting || !(isValid && dirty) || (otpSent && otpExpired)
              }
              className={`w-full ${
                isSubmitting || !(isValid && dirty) || (otpSent && otpExpired)
                  ? "bg-red-300 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600"
              } text-white py-3 px-4 rounded-md transition duration-200 font-medium`}
            >
              {otpSent && !otpExpired
                ? isSubmitting
                  ? "Verifying..."
                  : "Verify Code"
                : countdown > 0
                ? `Wait ${formatCountdown(countdown)}`
                : isSubmitting
                ? "Sending..."
                : "Send Code"}
            </button>

            {/* Resend or Edit options */}
            <div className="mt-4 flex justify-between">
              {otpSent && countdown === 0 && !otpExpired && (
                <button
                  type="button"
                  onClick={() => handleSendOtp(values.email, () => {})}
                  className="w-full text-red-500 hover:text-red-700 py-2 transition duration-200 font-medium"
                >
                  Resend Code
                </button>
              )}

              {otpSent && otpExpired && (
                <button
                  type="button"
                  onClick={() => handleResetOtp(setFieldValue)}
                  className="w-full text-blue-500 hover:text-blue-700 py-2 transition duration-200 font-medium"
                >
                  Edit Email Address
                </button>
              )}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AuthForm;
