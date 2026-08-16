import type { Metadata } from "next";
import Coaches from "@/components/template/Coaches/Coaches";
import { getCoaches } from "@/services/coaches";

export const metadata: Metadata = {
  title: "Our Coaches | Excel Pro Soccer Academy Markham",
  description:
    "Meet the coaching staff at Excel Pro Soccer Academy in Markham, Ontario — professional players and licensed coaches developing boys and girls aged 5 to 18.",
  alternates: {
    canonical: "https://www.excelproso.com/coaches",
  },
  openGraph: {
    title: "Our Coaches | Excel Pro Soccer Academy",
    description:
      "Professional players and licensed coaches developing boys and girls aged 5 to 18 in Markham, Ontario.",
    type: "website",
    url: "https://www.excelproso.com/coaches",
    siteName: "Excel Pro Soccer Academy",
    images: [
      {
        url: "https://www.excelproso.com/images/og/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy — Markham, Ontario",
      },
    ],
  },
};

/**
 * Fetched here rather than in the browser so the coach names and roles are in
 * the HTML itself. An edit made in Dashboard > Coaches shows on the next page
 * load, including to Google and to WhatsApp's link preview scraper.
 */
const CoachesPage = async () => {
  const coaches = await getCoaches();
  return <Coaches coaches={coaches} />;
};

export default CoachesPage;
