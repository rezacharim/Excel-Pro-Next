import type { Metadata } from "next";
import Indoor from "@/components/template/Indoor/Indoor";

export const metadata: Metadata = {
  title: "Indoor Season Registration | Excel Pro Soccer Academy Markham",
  description:
    "Reserve your child's spot for the Excel Pro Soccer Academy Indoor Season in Markham. Spaces are limited in each age group and confirmed once registration and payment are complete.",
  alternates: {
    canonical: "https://www.excelproso.com/indoor",
  },
  openGraph: {
    title: "Indoor Season Registration | Excel Pro Soccer Academy",
    description:
      "Reserve your child's spot for the Indoor Season. Spaces are limited in each age group.",
    type: "website",
    url: "https://www.excelproso.com/indoor",
    siteName: "Excel Pro Soccer Academy",
    images: [
      {
        url: "/images/billboard/teams.webp",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy indoor training in Markham, Ontario",
      },
    ],
  },
};

const IndoorPage = () => {
  return <Indoor />;
};

export default IndoorPage;
