import type { Metadata } from "next";
import Program from "@/components/template/Program/Program";

const SITE_URL = "https://www.excelproso.com";

export const metadata: Metadata = {
  title: "Youth Soccer Programs in Markham (Ages 5-18) | Excel Pro",
  description:
    "Kids soccer programs in Markham, Ontario for ages 5-18 — from Mini Kickers to High Performance. $380 per 2 months, Mon & Wed at Ashton Meadows Park.",
  alternates: {
    canonical: `${SITE_URL}/program`,
  },
  openGraph: {
    title: "Youth Soccer Programs in Markham (Ages 5-18) | Excel Pro",
    description:
      "Kids soccer programs in Markham, Ontario for ages 5-18 — from Mini Kickers to High Performance. $380 per 2 months, Mon & Wed at Ashton Meadows Park.",
    type: "website",
    url: `${SITE_URL}/program`,
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

const ProgramPage = () => {
  return (
    <main className="min-h-screen py-40">
      <Program />
    </main>
  );
};

export default ProgramPage;
