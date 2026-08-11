import type { Metadata } from "next";
import Account from "@/components/template/Account/Account";

export const metadata: Metadata = {
  title: "My Account | Excel Pro Soccer Academy",
  description:
    "Parent portal for Excel Pro Soccer Academy families. Check your player's membership status, request holds or installment plans, and download payment receipts.",
  alternates: {
    canonical: "https://www.excelproso.com/account",
  },
};

const AccountPage = () => {
  return (
    <main className="min-h-screen py-28 lg:py-24 md:py-28 sm:py-24">
      <Account />
    </main>
  );
};

export default AccountPage;
