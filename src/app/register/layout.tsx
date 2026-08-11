import { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import Layout from "@/components/template/Register/Layout";
import "../globals.css";


const montserrat = Montserrat({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});


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
