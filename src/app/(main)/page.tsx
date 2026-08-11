import type { Metadata } from "next";
import Landing from "@/components/template/Landing/Landing";

const SITE_URL = "https://www.excelproso.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Excel Pro Soccer Academy | Premier Youth Soccer Training",
  description:
    "Excel Pro, founded by former Iran National Team and Persepolis FC player Reza Abedian, offers Toronto youth personalized soccer training, focusing on skills, teamwork, and success.",
  keywords: [
    "football academy",
    "soccer training",
    "youth football",
    "soccer academy",
    "football training",
    "youth soccer",
    "Toronto soccer",
    "Markham soccer",
    "Excel Pro Academy",
    "Excel Pro Football Academy",
    "sports training",
  ],
  authors: [{ name: "Excel Pro Academy" }],
  creator: "Excel Pro Academy",
  publisher: "Excel Pro Academy",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  openGraph: {
    title: "Excel Pro Soccer Academy | Professional Soccer Training in Toronto",
    description:
      "Join Toronto's premier soccer academy for youth development. Professional coaches, personalized training, and competitive programs.",
    type: "website",
    url: SITE_URL,
    siteName: "Excel Pro Football Academy",
    locale: "en_US",
    images: [
      {
        url: "/images/billboard/teams.webp",
        width: 1200,
        height: 630,
        alt: "Excel Pro Football Academy Training Programs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Excel Pro Soccer Academy | Toronto",
    description:
      "Professional soccer training and development for youth players in Toronto.",
    images: ["/images/billboard/teams.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      en: SITE_URL,
      "en-US": SITE_URL,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function Home() {
  const schemaData = [
    // Organization schema
    {
      "@context": "https://schema.org",
      "@type": "SportsOrganization",
      "@id": `${SITE_URL}/#organization`,
      name: "Excel Pro Soccer Academy",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/logo/excelpro_logo.png`,
        width: 180,
        height: 60,
      },
      address: {
        "@type": "PostalAddress",
        // TODO: Reza to confirm the exact street address / postal code for Ashton Meadows Park
        streetAddress: "Ashton Meadows Park, 3rd Line",
        addressLocality: "Markham",
        addressRegion: "ON",
        addressCountry: "CA",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+1-647-703-7821",
        contactType: "customer service",
        email: "excelprosocceracademy@gmail.com",
      },
      sameAs: [
        // TODO: Reza to confirm the official Instagram handle
        "https://www.instagram.com/excel.pro.soccer.academy",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Excel Pro Soccer Academy",
      description:
        "Professional soccer training and development for youth players in Toronto",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    // WebPage schema
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: "Excel Pro Soccer Academy | Professional Soccer Training in Toronto",
      isPartOf: {
        "@id": `${SITE_URL}/#website`,
      },
      about: {
        "@id": `${SITE_URL}/#organization`,
      },
      description:
        "Excel Pro Academy offers professional soccer training and development programs for youth ages 5 to 18 in Toronto. Join us to develop skills, teamwork, and excellence.",
    },
    // LocalBusiness schema
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#localbusiness`,
      name: "Excel Pro Soccer Academy",
      image: `${SITE_URL}/images/billboard/teams.webp`,
      priceRange: "$$",
      telephone: "+1-647-703-7821",
      email: "excelprosocceracademy@gmail.com",
      url: SITE_URL,
      address: {
        "@type": "PostalAddress",
        // TODO: Reza to confirm the exact street address / postal code for Ashton Meadows Park
        streetAddress: "Ashton Meadows Park, 3rd Line",
        addressLocality: "Markham",
        addressRegion: "ON",
        addressCountry: "CA",
      },
      geo: {
        "@type": "GeoCoordinates",
        // TODO: Reza to confirm exact coordinates of Ashton Meadows Park
        latitude: "43.8887",
        longitude: "-79.3537",
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Wednesday"],
          opens: "17:00",
          closes: "20:00",
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <main
        id="home-page"
        className="min-h-screen"
        aria-label="Home Page"
        itemScope
        itemType="https://schema.org/WebPage"
      >
        <Landing />

        <section className="sr-only">
          <h2>
            Excel Pro Football Academy - Toronto&apos;s Premier Soccer Training
          </h2>
          <p>
            Welcome to Excel Pro Football Academy, a youth soccer academy in
            Markham, Ontario and the largest Iranian-based soccer academy in the
            Toronto area. Founded by former Iran National Team and Persepolis FC
            player Reza Abedian, we offer professional soccer training for youth
            ages 5 to 18. Our programs focus on developing technical skills,
            teamwork, strategy, and athletic excellence both on and off the
            field.
          </p>
          <p>
            With over 500 students, 18 years of experience, 12 professional
            coaches, and 10 awards won, Excel Pro Academy has established itself
            as a leader in youth soccer development across Markham, Toronto and
            the GTA.
          </p>
        </section>
      </main>
    </>
  );
}

export const revalidate = 3600;
