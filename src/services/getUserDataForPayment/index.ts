import { SubscriptionPlan } from "@/components/organisms/StripeElement/CheckoutForm";

export const updateUserDataForPayment = async (
  plan: SubscriptionPlan,
  stripeCustomerId: string | "",
  phone_number: string
) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/phone/${phone_number}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentStatus: "succeeded",
        activePlan: plan, // Send the actual plan name directly
        planId: plan, // Also include planId with the same value to match backend
        stripeCustomerId: stripeCustomerId || "",
      }),
      credentials: "include",
      mode: "cors",
    }
  );

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

export const getUserDataForPayment = async (phone_number: string | null) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/phone/${phone_number}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
    }
  );
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};
