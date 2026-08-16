import type { Metadata } from "next";
import Matchday from "@/components/template/Matchday/Matchday";

const SITE_URL = "https://www.excelproso.com";

export const metadata: Metadata = {
  title: "Matchday Schedule | Excel Pro Soccer Academy Markham",
  description:
    "Game schedules and matchday results for Excel Pro Soccer Academy teams — youth soccer matches for ages 5-18 across Markham, Toronto and the GTA each season.",
  alternates: {
    canonical: `${SITE_URL}/matchday`,
  },
  openGraph: {
    title: "Matchday Schedule | Excel Pro Soccer Academy Markham",
    description:
      "Game schedules and matchday results for Excel Pro Soccer Academy teams — youth soccer matches for ages 5-18 across Markham, Toronto and the GTA each season.",
    type: "website",
    url: `${SITE_URL}/matchday`,
    siteName: "Excel Pro Soccer Academy",
    images: [
      {
        url: "https://www.excelproso.com/images/og/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy, Markham Ontario",
      },
    ],
  },
};

const MatchdayPage = () => {
  return (
    <main className="min-h-screen">
      <Matchday />
    </main>
  );
};

export default MatchdayPage;
