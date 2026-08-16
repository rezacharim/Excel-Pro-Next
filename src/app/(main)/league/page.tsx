import type { Metadata } from "next";
import League from "@/components/template/League/League";

export const metadata: Metadata = {
  title: "Winter League Registration U9–U16 | Excel Pro Soccer Academy",
  description:
    "Register for the Excel Pro Soccer Academy Winter League season — U9 to U16, Ontario PISL and York Region Soccer League. Season starts mid-October. Roster spots are limited.",
  alternates: {
    canonical: "https://www.excelproso.com/league",
  },
  openGraph: {
    title: "Winter League Registration U9–U16 | Excel Pro Soccer Academy",
    description:
      "Registration is open for U9–U16. Ontario PISL & YRSL, season starts mid-October. Roster spots are limited and confirmed on payment.",
    type: "website",
    url: "https://www.excelproso.com/league",
    siteName: "Excel Pro Soccer Academy",
    images: [
      {
        url: "https://www.excelproso.com/images/og/og-league.jpg",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy — Winter League 2026/27 registration",
      },
    ],
  },
};

const LeaguePage = () => {
  return <League />;
};

export default LeaguePage;
