import type { Metadata } from "next";
import Indoor from "@/components/template/Indoor/Indoor";

export const metadata: Metadata = {
  title: "Indoor Season Registration | Excel Pro Soccer Academy",
  description:
    "Join the Excel Pro Soccer Academy Indoor Season at Richmond Hill Green Dome, ages 6 to 18, two sessions a week. New players can join during the season while spaces last.",
  alternates: {
    canonical: "https://www.excelproso.com/indoor",
  },
  openGraph: {
    title: "Indoor Season Registration | Excel Pro Soccer Academy",
    description:
      "Indoor Season at Richmond Hill Green Dome — new players can still join. Spaces are limited in each age group.",
    type: "website",
    url: "https://www.excelproso.com/indoor",
    siteName: "Excel Pro Soccer Academy",
    images: [
      {
        url: "https://www.excelproso.com/images/og/og-indoor.jpg?v=2",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy — Indoor Season 2026/27, on now, new players welcome",
      },
    ],
  },
};

const IndoorPage = () => {
  return <Indoor />;
};

export default IndoorPage;
