import type { Metadata } from "next";
import Program from "@/components/template/Program/Program";

const SITE_URL = "https://www.excelproso.com";

export const metadata: Metadata = {
  title: "Youth Soccer Programs, Ages 6-18 | Richmond Hill Green Dome | Excel Pro",
  description:
    "Youth soccer programs for ages 6-18 — U6-U9, U10-U12, U13-U14 and U15-U18. Twice a week at Richmond Hill Green Dome from October 5. $380 per 2 months.",
  alternates: {
    canonical: `${SITE_URL}/program`,
  },
  openGraph: {
    title: "Youth Soccer Programs, Ages 6-18 | Richmond Hill Green Dome | Excel Pro",
    description:
      "Youth soccer programs for ages 6-18 — U6-U9, U10-U12, U13-U14 and U15-U18. Twice a week at Richmond Hill Green Dome from October 5. $380 per 2 months.",
    type: "website",
    url: `${SITE_URL}/program`,
    siteName: "Excel Pro Soccer Academy",
    images: [
      {
        url: "https://www.excelproso.com/images/og/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy",
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
