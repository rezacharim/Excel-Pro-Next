import type { Metadata } from "next";
import { Suspense } from "react";
import Receipt from "@/components/template/Account/Receipt";

export const metadata: Metadata = {
  title: "Receipt | Excel Pro Soccer Academy",
  description:
    "Payment receipt and annual statements for Excel Pro Soccer Academy families.",
  robots: { index: false },
};

const ReceiptPage = () => {
  return (
    <main className="min-h-screen py-28 lg:py-24 md:py-28 sm:py-24 print:py-0 print:min-h-0">
      <Suspense
        fallback={
          <p className="text-center text-gray-500 py-16">Loading receipt...</p>
        }
      >
        <Receipt />
      </Suspense>
    </main>
  );
};

export default ReceiptPage;
