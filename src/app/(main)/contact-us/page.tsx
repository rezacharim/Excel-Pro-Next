import type { Metadata } from "next";
import ContactUs from "@/components/template/ContactUs/ContactUs";
import { contactFaqData } from "@/data/faq";

const SITE_URL = "https://www.excelproso.com";

export const metadata: Metadata = {
  title: "Contact Us | Excel Pro Soccer Academy Markham",
  description:
    "Contact Excel Pro Soccer Academy in Markham, Ontario. Call +1 647-703-7821 or email us about kids soccer programs, tryouts and registration in the GTA.",
  alternates: {
    canonical: `${SITE_URL}/contact-us`,
  },
  openGraph: {
    title: "Contact Us | Excel Pro Soccer Academy Markham",
    description:
      "Contact Excel Pro Soccer Academy in Markham, Ontario. Call +1 647-703-7821 or email us about kids soccer programs, tryouts and registration in the GTA.",
    type: "website",
    url: `${SITE_URL}/contact-us`,
    siteName: "Excel Pro Soccer Academy",
    images: [
      {
        url: "/images/billboard/teams.webp",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy youth teams in Markham, Ontario",
      },
    ],
  },
};

const ContactUsPage = () => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: contactFaqData.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen py-28 lg:py-24 md:py-28 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <ContactUs />
    </main>
  );
};

export default ContactUsPage;
