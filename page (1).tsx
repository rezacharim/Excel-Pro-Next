import type { Metadata } from "next";
import Announcements from "@/components/template/Announcements/Announcements";

export const metadata: Metadata = {
  title: "News & Soccer Tryouts in Markham | Excel Pro Academy",
  description:
    "The latest news, soccer tryout dates and league registration announcements from Excel Pro Soccer Academy in Markham, Ontario — youth soccer news for the GTA.",
  alternates: {
    canonical: "https://www.excelproso.com/announcements",
  },
  openGraph: {
    title: "News & Soccer Tryouts in Markham | Excel Pro Academy",
    description:
      "The latest news, soccer tryout dates and league registration announcements from Excel Pro Soccer Academy in Markham, Ontario — youth soccer news for the GTA.",
    type: "website",
    url: "https://www.excelproso.com/announcements",
    siteName: "Excel Pro Soccer Academy",
    images: [
      {
        url: "https://www.excelproso.com/images/og/og-trials.jpg",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy — open trials in Markham",
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
