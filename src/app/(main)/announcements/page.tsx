import type { Metadata } from "next";
import Announcements from "@/components/template/Announcements/Announcements";

export const metadata: Metadata = {
  title: "News, Trials & League Registration | Excel Pro Soccer Academy",
  description:
    "The latest news, trial dates and league registration announcements from Excel Pro Soccer Academy in Markham, Ontario.",
  alternates: {
    canonical: "https://www.excelproso.com/announcements",
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
