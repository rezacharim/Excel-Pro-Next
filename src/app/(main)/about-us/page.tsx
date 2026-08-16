import type { Metadata } from "next";
import AboutUs from "@/components/template/AboutUs/AboutUs";

const SITE_URL = "https://www.excelproso.com";

export const metadata: Metadata = {
  title: "About Us | Excel Pro Soccer Academy Markham",
  description:
    "Excel Pro is a youth soccer academy in Markham, Ontario founded by former Iran National Team & Persepolis FC player Reza Abedian, serving kids 5-18 GTA-wide.",
  alternates: {
    canonical: `${SITE_URL}/about-us`,
  },
  openGraph: {
    title: "About Us | Excel Pro Soccer Academy Markham",
    description:
      "Excel Pro is a youth soccer academy in Markham, Ontario founded by former Iran National Team & Persepolis FC player Reza Abedian, serving kids 5-18 GTA-wide.",
    type: "website",
    url: `${SITE_URL}/about-us`,
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

const AboutUsPage = () => {
  return (
    <main className="min-h-screen py-28 lg:py-24 md:py-28 sm:py-24">
      <AboutUs />
    </main>
  );
};

export default AboutUsPage;
