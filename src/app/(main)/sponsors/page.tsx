import type { Metadata } from "next";
import Sponsors from "@/components/template/Sponsors/Sponsors";

export const metadata: Metadata = {
  title: "Sponsors & Partners | Excel Pro Soccer Academy",
  description:
    "Meet the sponsors and partners of Excel Pro Soccer Academy - local businesses helping young players grow in Markham and the GTA. Learn how your business can sponsor our youth soccer programs.",
  alternates: {
    canonical: "https://www.excelproso.com/sponsors",
  },
};

const SponsorsPage = () => {
  return (
    <main className="min-h-screen py-28 lg:py-24 md:py-28 sm:py-24">
      <Sponsors />
    </main>
  );
};

export default SponsorsPage;
