"use client";
import StripeProvider from "./StripeProvider";
import CheckoutForm from "./CheckoutForm";

export default function PaymentPage() {
  return (
    <div className="container mx-auto">
      <StripeProvider>
        <CheckoutForm />
      </StripeProvider>
    </div>
  );
}