import type { Metadata } from "next";
import Announcements from "@/components/template/Announcements/Announcements";

export const metadata: Metadata = {
  title: "News, Trials & Free Sessions | Excel Pro Soccer Academy",
  description:
    "Match reports and academy news from Excel Pro Soccer Academy, plus I-Model Team trials (U13–U16) and free trial sessions at Richmond Hill Green Dome.",
  alternates: {
    canonical: "https://www.excelproso.com/announcements",
  },
  openGraph: {
    title: "News, Trials & Free Sessions | Excel Pro Soccer Academy",
    description:
      "Match reports and academy news from Excel Pro Soccer Academy, plus I-Model Team trials (U13–U16) and free trial sessions at Richmond Hill Green Dome.",
    type: "website",
    url: "https://www.excelproso.com/announcements",
    siteName: "Excel Pro Soccer Academy",
    images: [
      {
        url: "https://www.excelproso.com/images/og/og-trials.jpg?v=2",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy — I-Model Team trials and free sessions",
      },
    ],
  },
};

const AnnouncementsPage = () => {
  return (
    <main className="min-h-screen py-28 lg:py-24 md:py-28 sm:py-24">
      <Announcements />
    </main>
  );
};

export default AnnouncementsPage;
