import type { Metadata } from "next";
import Sponsors from "@/components/template/Sponsors/Sponsors";

export const metadata: Metadata = {
  title: "Sponsors & Partners | Excel Pro Soccer Academy",
  description:
    "Meet the sponsors and partners behind Excel Pro Soccer Academy in Markham, Ontario — and learn how your business can support youth soccer across the GTA.",
  alternates: {
    canonical: "https://www.excelproso.com/sponsors",
  },
  openGraph: {
    title: "Sponsors & Partners | Excel Pro Soccer Academy",
    description:
      "Meet the sponsors and partners behind Excel Pro Soccer Academy in Markham, Ontario — and learn how your business can support youth soccer across the GTA.",
    type: "website",
    url: "https://www.excelproso.com/sponsors",
    siteName: "Excel Pro Soccer Academy",
    images: [
      {
        url: "/images/billboard/teams.webp",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy youth teams in Markham, Ontario",
      },
    ],
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
