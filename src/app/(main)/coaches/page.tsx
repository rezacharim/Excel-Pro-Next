import type { Metadata } from "next";
import Coaches from "@/components/template/Coaches/Coaches";

export const metadata: Metadata = {
  title: "Our Coaches | Excel Pro Soccer Academy Markham",
  description:
    "Meet the Excel Pro coaching team led by founder Reza Abedian, former Iran National Team & Persepolis FC player. Youth soccer coaching in Markham for ages 5-18.",
  alternates: {
    canonical: "https://www.excelproso.com/coaches",
  },
  openGraph: {
    title: "Our Coaches | Excel Pro Soccer Academy Markham",
    description:
      "Meet the Excel Pro coaching team led by founder Reza Abedian, former Iran National Team & Persepolis FC player. Youth soccer coaching in Markham for ages 5-18.",
    type: "website",
    url: "https://www.excelproso.com/coaches",
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

const CoachesPage = () => {
  return (
    <main className="min-h-screen py-28 lg:py-24 md:py-28 sm:py-24">
      <Coaches />
    </main>
  );
};

export default CoachesPage;
