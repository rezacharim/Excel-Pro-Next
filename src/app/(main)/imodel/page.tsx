import type { Metadata } from "next";
import IModel from "@/components/template/IModel/IModel";

export const metadata: Metadata = {
  title: "I-Model Team Summer 2027 | Excel Pro Soccer Academy",
  description:
    "The Excel Pro I-Model Team (U13–U16) prepares all winter at Richmond Hill Green Dome for the Summer I-Model League. Players are selected at a free trial. Early bird $1,050 when paid in full by January 31, 2027.",
  alternates: {
    canonical: "https://www.excelproso.com/imodel",
  },
  openGraph: {
    title: "I-Model Team Summer 2027 | Excel Pro Soccer Academy",
    description:
      "Selective U13–U16 squad for the Summer I-Model League. Book a free trial — early bird $1,050 for selected players who pay by January 31, 2027.",
    type: "website",
    url: "https://www.excelproso.com/imodel",
    siteName: "Excel Pro Soccer Academy",
  },
};

const IModelPage = () => {
  return <IModel />;
};

export default IModelPage;
