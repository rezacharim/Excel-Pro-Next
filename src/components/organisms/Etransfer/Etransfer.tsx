"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import useUserFormStore from "../../../stores/UserFormStore";
import { useDivisionStore } from "@/stores/divisionStore";
import { useIsFirstRegister } from "@/stores/firstTimeRegister";
import { Button } from "@/components/atoms/Button/Button";
import BankLinks from "@/components/molecules/BankLinks/BankLinks";

export type SubscriptionPlan =
  | "free"
  | "U5_U8"
  | "U9_U12"
  | "U13_U14"
  | "U15_U18";

interface Plan {
  title: string;
  price: string;
  priceId: string | null;
  features: string[];
}

const plans: Record<SubscriptionPlan, Plan> = {
  free: {
    title: "Free",
    price: "0/2 months",
    priceId: null,
    features: ["Limited Features"],
  },
  U5_U8: {
    title: "U5-U8",
    price: "380/2 months",
    priceId: `${process.env.NEXT_PUBLIC_U5_U8}`,
    features: ["Feature 1", "Feature 2"],
  },
  U9_U12: {
    title: "U9-U12",
    price: "380/2 months",
    priceId: `${process.env.NEXT_PUBLIC_U9_U12}`,
    features: ["All Basic features", "Feature 3", "Feature 4"],
  },
  U13_U14: {
    title: "U13-U14",
    price: "380/2 months",
    priceId: `${process.env.NEXT_PUBLIC_U13_U14}`,
    features: ["All Pro features", "Feature 5", "Feature 6"],
  },
  U15_U18: {
    title: "U15-U18",
    price: "380/2 months",
    priceId: `${process.env.NEXT_PUBLIC_U15_U18}`,
    features: ["All Pro features", "Feature 5", "Feature 6"],
  },
};

// Helper function to display plan name
const getPlanDisplayName = (plan: string): string => {
  const planKey = plan as SubscriptionPlan;
  return plans[planKey]?.title || plan;
};

// Normalize division format
const normalizeDivision = (str: string): SubscriptionPlan => {
  if (!str || typeof str !== "string") {
    console.warn("Invalid division input:", str);
    return "U13_U14"; // Default to U13_U14
  }

  try {
    // If "free" is specifically requested, return free
    if (str.toLowerCase() === "free") {
      return "free";
    }

    // If division already has the correct format, return it directly
    if (plans[str as SubscriptionPlan]) {
      return str as SubscriptionPlan;
    }

    // Convert to uppercase and replace dashes or en-dashes with underscores
    const normalized = str.toUpperCase().replace(/–|-|‐|\s+/g, "_");

    // Check if the result is valid
    if (plans[normalized as SubscriptionPlan]) {
      return normalized as SubscriptionPlan;
    }

    // Try more aggressively by removing all underscores
    const withoutUnderscores = normalized.replace(/_+/g, "");

    // Check for patterns like U5U8, U9U12, etc.
    for (const validPlan of Object.keys(plans)) {
      if (validPlan === "free") continue;

      const [prefix, suffix] = validPlan.split("_");
      if (withoutUnderscores === prefix + suffix) {
        return validPlan as SubscriptionPlan;
      }

      // Also try matching based on numbers only (for cases like 13-14, etc.)
      const planNumbers = validPlan.replace(/\D+/g, "");
      const inputNumbers = withoutUnderscores.replace(/\D+/g, "");

      if (planNumbers === inputNumbers) {
        return validPlan as SubscriptionPlan;
      }
    }

    // If nothing else matches, return U13_U14 as the default
    console.warn(
      `Could not normalize division "${str}", using U13_U14 as default`
    );
    return "U13_U14"; // Default to U13_U14
  } catch (error) {
    console.error("Error in normalizeDivision:", error);
    return "U13_U14"; // Default to U13_U14 in case of error
  }
};

// Function to get user by phone number
export const getUserByPhoneNumber = async (phone_number: string) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/phone/${phone_number}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Something went wrong");
    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

const Etransfer = () => {
  const router = useRouter();
  const userForm = useUserFormStore();
  const { division } = useDivisionStore();
  const { isFirstTime } = useIsFirstRegister();

  // State management
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: initial, 2: instructions, 3: confirmation
  const [transferId, setTransferId] = useState<string | null>(null);
  const [transferToken, setTransferToken] = useState<string | null>(null);
  const [serverAmount, setServerAmount] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("U13_U14");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const bankEmails = [
    {
      id: 0,
      email: "Excelpro.Etransfer@gmail.com",
      notes:
        "Note: Please include your order number, registered player name, phone number, and email in the transfer details.",
    },
  ];

  // Calculate final price
  const price = plans[selectedPlan]?.price?.split("/")[0] || "380";
  const firstTimeRegistrationFee = 75; // First-time registration fee
  const finalPrice = isFirstTime
    ? (parseInt(price) + firstTimeRegistrationFee).toString()
    : price;

  // Initialize selected plan from the division store
  useEffect(() => {
    try {
      if (!division || division === "undefined" || division === "null") {
        setSelectedPlan("U13_U14");
        return;
      }

      try {
        const decodedDivision = decodeURIComponent(division);
        const normalizedDivision = normalizeDivision(decodedDivision);

        // If division is free after normalization but it shouldn't be, use U13_U14 as default
        if (
          normalizedDivision === "free" &&
          decodedDivision.toLowerCase() !== "free"
        ) {
          setSelectedPlan("U13_U14");
        } else {
          setSelectedPlan(normalizedDivision);
        }
      } catch (decodeError) {
        console.error("Error decoding division:", decodeError);
        setSelectedPlan("U13_U14");
      }
    } catch (error) {
      console.error("Error in division processing:", error);
      setSelectedPlan("U13_U14");
    }
  }, [division]);

  // Identify which player this payment is for. The registration step stores
  // the newly created player's id — use it directly so families with more
  // than one player (same parent phone) never pay against the wrong player.
  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    if (storedId && /^\d+$/.test(storedId)) {
      setUserId(storedId);
      return;
    }

    // Fallback for older sessions: look the player up by phone number.
    const fetchUserId = async () => {
      if (!userForm.phone_number) return;

      try {
        setLoading(true);
        const userData = await getUserByPhoneNumber(userForm.phone_number);
        if (userData && userData.id) {
          setUserId(userData.id);
        } else {
          setError(
            "User not found. Please check your phone number or register first."
          );
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(
          err instanceof Error ? err.message : "Error fetching user data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserId();
  }, [userForm.phone_number]);

  // Create transfer request
  const createTransfer = async () => {
    setLoading(true);
    setError("");

    try {
      // Check if userId is available
      if (!userId) {
        setError("User ID not found. Please try again or contact support.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transfer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // The id can come from localStorage as text — the API requires a
            // real number or it rejects with "userId must be a number".
            userId: Number(userId),
            plan: selectedPlan,
            amount: Number(finalPrice),
            isFirstTime: isFirstTime,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating payment request");
      }

      const data = await response.json();
      setTransferId(data.id);
      setTransferToken(data.token);
      // The backend decides the final amount — display that, not our guess.
      if (data.amount) {
        setServerAmount(String(Math.round(Number(data.amount))));
      }
      setStep(2); // Go to instructions step
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error creating payment request"
      );
    } finally {
      setLoading(false);
    }
  };

  // Confirm payment completion
  const confirmPayment = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!transferToken) {
        throw new Error("Invalid transfer token");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transfer/token/${transferToken}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error confirming payment");
      }
      setStep(3); // Go to final confirmation step
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error confirming payment");
    } finally {
      setLoading(false);
    }
  };

  // Loading state while fetching user data
  if (!userId && !error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Loading payment information...
        </h1>
        <div className="flex justify-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">
        E-Transfer Payment
      </h1>

      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="mb-4">
            With e-transfer, you can directly transfer the amount to our
            account.
          </p>
          <div className="bg-gray-100 p-4 rounded mb-6">
            <h2 className="font-bold mb-2">Your Registration Information:</h2>
            <p>Name: {userForm.fullname}</p>
            <p>Email: {userForm.email}</p>
            <p>Phone: {userForm.phone_number}</p>
            <hr className="my-2" />
            <p className="font-bold">Selected Plan Details:</p>
            <p>Plan: {getPlanDisplayName(selectedPlan)}</p>
            <p>Amount: ${finalPrice}</p>
            <p className="mt-2 text-sm text-gray-600">
              {isFirstTime
                ? `It appears this is your first time registering. ($${firstTimeRegistrationFee} first-time registration fee added)`
                : "Welcome back! You've registered with us before."}
            </p>
            <p className="mt-3 text-sm">
              You&apos;ll send an Interac e-transfer to:{" "}
              <span className="font-bold text-gray-900 break-all">
                {bankEmails[0].email}
              </span>
            </p>
            <p className="text-sm text-red-600 mt-2">
              ⚠️ Please make sure to include the{" "}
              <strong>player&apos;s full name</strong> and{" "}
              <strong>phone number</strong> in the message or note section when
              sending the e-Transfer. This is required to identify your payment.
            </p>
          </div>
          <p className="mb-4">
            After clicking the button below, you will see transfer instructions.
            <br />
            Note: After completing your payment, you must return to this page
            and confirm your payment.
          </p>
          <button
            onClick={createTransfer}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {loading ? "Please wait..." : "Start Payment"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6"
            role="alert"
          >
            <p className="font-bold">Important:</p>
            <p>
              After completing the transfer, please return to this page and
              confirm your payment.
            </p>
            <p>Your reference number: {transferId}</p>
          </div>

          <div className="bg-gray-100 p-4 rounded mb-6">
            <h2 className="text-lg font-bold mb-2">Transfer Instructions</h2>
            <p className="mb-2">
              Please make your payment to the following account:
            </p>
            <ul className="list-disc pl-5 mb-4">
              <li>Email: {bankEmails[0].email}</li>
            </ul>
            <p className="text-sm text-gray-600">{bankEmails[0].notes}</p>
            <p className="font-bold mt-4">
              Amount to pay: ${serverAmount || finalPrice}
            </p>
            <BankLinks />
          </div>

          <p className="mb-4">
            After making the transfer, click the button below to confirm:
          </p>

          <button
            onClick={confirmPayment}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {loading ? "Processing..." : "I Have Completed The Transfer"}
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div
            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6"
            role="alert"
          >
            <p className="font-bold">Thank You!</p>
            <p>Your payment confirmation has been recorded.</p>
            <p>
              Our team will verify your payment and update your subscription
              status.
            </p>
            <p>This usually takes 1-2 business days.</p>
          </div>

          <div className="bg-gray-100 p-4 rounded mb-6">
            <p className="font-bold">Payment Details:</p>
            <p>Reference Number: {transferId}</p>
            <p>Plan: {getPlanDisplayName(selectedPlan)}</p>
            <p>Amount: ${serverAmount || finalPrice}</p>
            <p className="text-amber-600 font-medium mt-2">
              Note: Your registration will be finalized after admin approval.
            </p>
          </div>

          <Button
            onClick={() => router.push("/account")}
            className="w-full text-white font-bold rounded focus:outline-none focus:shadow-outline"
          >
            Go to my family dashboard
          </Button>
          <p className="mt-3 text-center text-sm text-gray-500">
            Your player, renewal date and receipts all live in{" "}
            <span className="font-medium">My Account</span> — you can come back
            any time with just your email.
          </p>
        </div>
      )}
    </div>
  );
};

export default Etransfer;
