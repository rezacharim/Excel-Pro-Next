import { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import "../globals.css";

const montserrat = Montserrat({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-US">
      <body className={`${montserrat.className} antialiased`}>{children}</body>
    </html>
  );
}
