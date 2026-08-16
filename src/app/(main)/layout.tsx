import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "../globals.css";
import Layout from "@/components/template/Layout";


const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.excelproso.com"),
  // Fallback link preview for every page under the site that does not set its
  // own. Individual pages (home, /league, /indoor, /announcements) override
  // this with their own card.
  openGraph: {
    type: "website",
    siteName: "Excel Pro Soccer Academy",
    url: "https://www.excelproso.com",
    title: "Excel Pro Soccer Academy | Markham, Ontario",
    description:
      "Professional soccer training in Markham. Year-round academy programs, competitive league teams and indoor season training for boys and girls U5–U19.",
    images: [
      {
        url: "https://www.excelproso.com/images/og/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy — Markham, Ontario",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Excel Pro Soccer Academy | Markham, Ontario",
    description:
      "Professional soccer training in Markham. Year-round academy programs, competitive league teams and indoor season training.",
    images: ["https://www.excelproso.com/images/og/og-default.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" dir="ltr">
      <body
        className={`${montserrat.className} antialiased`}
      >
        <Layout>
        {children}
        </Layout>
      </body>
    </html>
  );
}
