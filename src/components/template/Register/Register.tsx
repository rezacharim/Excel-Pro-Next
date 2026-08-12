"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AuthForm from "@/components/organisms/AuthForm/AuthForm";
import RegisterForm from "@/components/organisms/RegisterContent/RegisterForm/RegisterForm";
import useUserFormStore from "@/stores/UserFormStore";
import { useRegisterStepStore } from "@/stores/registerStepStore";
import { useIsFirstRegister } from "@/stores/firstTimeRegister";

const Register = () => {
  const [auth, setAuth] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const [portalEmail, setPortalEmail] = useState<string | null>(null);
  const { setEmail, setEmailVerified } = useUserFormStore();
  const { setIsFirstTime } = useIsFirstRegister();

  // A parent who already verified their email (family dashboard session)
  // shouldn't have to request a new code to add another player — recognize
  // the session and start the wizard right away.
  useEffect(() => {
    const token = localStorage.getItem("portal_token");
    const email = localStorage.getItem("portal_email");
    if (token && email) {
      setEmail(email);
      setEmailVerified(true);
      setPortalEmail(email);
      // Every player created through the wizard is new, so the one-time
      // registration fee applies regardless of the parent's history.
      setIsFirstTime(true);
      setAuth(true);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every fresh visit to /register must start at step 1 of the wizard — never
  // on a leftover payment step saved from a previous registration. The saved
  // step is restored from localStorage slightly AFTER first render, so reset
  // both now and again the moment restoration finishes. After that the store
  // is left alone (finishing the wizard legitimately moves to payment).
  useEffect(() => {
    const resetStaleStep = () => {
      const s = useRegisterStepStore.getState().step;
      if (s < 1 || s > 5) useRegisterStepStore.getState().setStep(1);
    };
    resetStaleStep();
    const persistApi = (
      useRegisterStepStore as unknown as {
        persist?: {
          hasHydrated: () => boolean;
          onFinishHydration: (fn: () => void) => () => void;
        };
      }
    ).persist;
    if (persistApi && !persistApi.hasHydrated()) {
      return persistApi.onFinishHydration(resetStaleStep);
    }
  }, []);

  const useDifferentEmail = () => {
    setPortalEmail(null);
    setEmailVerified(false);
    setAuth(false);
  };

  if (!ready) return <section className="min-h-screen" />;

  return (
    <section>
      {!auth ? (
        <div className="min-h-screen flex items-center">
          <AuthForm
            auth={(state: boolean) => {
              setAuth(state);
            }}
          />
        </div>
      ) : (
        <>
          {portalEmail && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm">
                <p className="text-gray-700">
                  Registering a new player under{" "}
                  <span className="font-semibold">{portalEmail}</span>
                </p>
                <div className="flex items-center gap-4">
                  <Link
                    href="/account"
                    className="text-primary font-medium hover:underline"
                  >
                    Back to my dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={useDifferentEmail}
                    className="text-gray-500 hover:text-gray-700 hover:underline"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            </div>
          )}
          <RegisterForm />
        </>
      )}
    </section>
  );
};

export default Register;
