import type { Metadata } from "next";
import Program from "@/components/template/Program/Program";
import { PRICING } from "@/data/programs";
import {
  ACADEMY_GROUPS,
  AGE_RANGE,
  CURRENT_SEASON,
  VENUE,
} from "@/data/academy";

const SITE_URL = "https://www.excelproso.com";

// Built from src/data/academy.ts so it follows the active season.
const TITLE = `Youth Soccer Programs, Ages ${AGE_RANGE.short} | ${VENUE.name} | Excel Pro`;
const DESCRIPTION = `Youth soccer programs for ages ${AGE_RANGE.short}: ${ACADEMY_GROUPS.map(
  (g) => g.key
).join(", ")}. Twice a week at ${VENUE.name}, ${CURRENT_SEASON.name} starts ${CURRENT_SEASON.startsOn}. ${PRICING.price} per ${PRICING.term}.`;

export const metadata: Metadata = {
  title: TITLE,
  description:
    DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/program`,
  },
  openGraph: {
    title: TITLE,
    description:
      DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/program`,
    siteName: "Excel Pro Soccer Academy",
    images: [
      {
        url: "https://www.excelproso.com/images/og/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Excel Pro Soccer Academy",
      },
    ],
  },
};

const ProgramPage = () => {
  return (
    <main className="min-h-screen py-40">
      <Program />
    </main>
  );
};

export default ProgramPage;
