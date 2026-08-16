import { ReactNode } from "react";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Layout from "@/components/template/Register/Layout";
import "../globals.css";


const montserrat = Montserrat({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Register — Excel Pro Soccer Academy Markham",
  description:
    "Register your child for youth soccer programs at Excel Pro Soccer Academy in Markham, Ontario. Ages 5-18, $380 per 2 months, e-transfer payment accepted.",
  alternates: {
    canonical: "https://www.excelproso.com/register",
  },
  openGraph: {
    title: "Register — Excel Pro Soccer Academy Markham",
    description:
      "Register your child for youth soccer programs at Excel Pro Soccer Academy in Markham, Ontario. Ages 5-18, $380 per 2 months, e-transfer payment accepted.",
    type: "website",
    url: "https://www.excelproso.com/register",
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


export default function RegisterLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en-US" dir="ltr">
      <body className={`${montserrat.className} antialiased`}>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
