import { Montserrat } from "next/font/google";
import "../globals.css";
import Layout from "@/components/template/Layout";


const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'], 
});

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
