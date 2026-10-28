import type { Metadata } from "next";
import Policies from "@/components/template/Policies/Policies";

export const metadata: Metadata = {
  title: "Agreement, Refund & Photo Policy | Excel Pro Soccer Academy",
  description:
    "Excel Pro Soccer Academy's player and parent agreement: refunds and credits, acknowledgement of risk, Rowan's Law concussion safety, and photo and video use.",
  alternates: { canonical: "https://www.excelproso.com/policies" },
};

const PoliciesPage = () => <Policies />;

export default PoliciesPage;
