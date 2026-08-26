import { ReactNode } from "react";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "../globals.css";
import GoogleAnalytics from "@/components/atoms/GoogleAnalytics/GoogleAnalytics";

const montserrat = Montserrat({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Login | Excel Pro Soccer Academy",
  description: "Login to your Excel Pro Soccer Academy account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-US">
      <body className={`${montserrat.className} antialiased`}>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
