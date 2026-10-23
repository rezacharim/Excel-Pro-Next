import type { Metadata } from "next";
import Trials from "@/components/template/Trials/Trials";

const URL = "https://www.excelproso.com/trials";
const DESCRIPTION =
  "Book a free session at Excel Pro Soccer Academy, Richmond Hill Green Dome: I-Model Team trials for U13–U16, or a free first training session for ages 6 to 18.";

export const metadata: Metadata = {
  title: "Free Trial Session & I-Model Team Trials | Excel Pro Soccer Academy",
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: "Free trial session & I-Model Team trials | Excel Pro",
    description: DESCRIPTION,
    type: "website",
    url: URL,
    siteName: "Excel Pro Soccer Academy",
    images: [
      {
        url: "https://www.excelproso.com/images/og/og-trials.jpg?v=2",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy — I-Model Team trials U13–U16 and free trial sessions",
      },
    ],
  },
};

const TrialsPage = () => <Trials />;

export default TrialsPage;
