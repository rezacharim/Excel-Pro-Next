import type { Metadata } from "next";
import { NextPage } from "next";
import { notFound, redirect } from "next/navigation";
import { programs } from "@/components/organisms/SummeryPrograms/data";
import type { ProgramEntry } from "@/components/organisms/SummeryPrograms/data";
import ProgramDetails from "@/components/template/Program/ProgramDetails/ProgramDetails";

const SITE_URL = "https://www.excelproso.com";

interface ProgramPageProps {
  params: { slug: string };
}

const normalize = (str: string): string =>
  str
    .toLowerCase()
    .replace(/\s*–\s*/g, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, "");

const decodeSlug = (slug: string): string =>
  decodeURIComponent(slug).replace(/–/g, "-");

/** Resolve a /program/[slug] URL to a program in the catalog (or null). */
const resolveProgram = (rawSlug: string): ProgramEntry | null => {
  const decodedSlug = decodeSlug(rawSlug);

  const slugMatches = decodedSlug.match(/^u(\d+)-u(\d+)$/i);
  if (!slugMatches) {
    return null;
  }

  const requestedStartAge = parseInt(slugMatches[1]);
  const requestedEndAge = parseInt(slugMatches[2]);

  const program = programs.find((p) => {
    if (normalize(p.ageGroup) === normalize(decodedSlug)) {
      return true;
    }

    const groupMatches = p.ageGroup.match(/u(\d+)\s*[–-]\s*u(\d+)/i);
    if (groupMatches) {
      const groupStartAge = parseInt(groupMatches[1]);
      const groupEndAge = parseInt(groupMatches[2]);

      return (
        requestedStartAge >= groupStartAge && requestedEndAge <= groupEndAge
      );
    }

    return false;
  });

  return program ?? null;
};

/** Unique, locally-targeted meta descriptions per division (140-160 chars). */
const PROGRAM_DESCRIPTIONS: Record<string, string> = {
  "u5-u8":
    "Mini Kickers (ages 5-8): fun, play-based soccer training for kids in Markham & the GTA. Twice-weekly sessions at Ashton Meadows Park, uniform included.",
  "u9-u12":
    "Foundation Phase (ages 9-12): technical soccer training for kids in Markham, Ontario — ball mastery, positional play and yearly league selection chances.",
  "u13-u14":
    "Competitive Phase (ages 13-14): position-specific youth soccer training in Markham with matches across Toronto & the GTA. Mon & Wed at Ashton Meadows Park.",
  "u15-u18":
    "High Performance (ages 15-18): advanced soccer training in Markham & the GTA — showcases, video analysis and pathways to university and semi-pro soccer.",
};

export function generateStaticParams() {
  return programs.map((program) => ({ slug: program.slug }));
}

export function generateMetadata({ params }: ProgramPageProps): Metadata {
  const program = resolveProgram(params.slug);

  if (!program) {
    return {
      title: "Youth Soccer Programs in Markham | Excel Pro Academy",
      robots: { index: false, follow: true },
    };
  }

  // e.g. "U9–U12 Soccer Program in Markham | Excel Pro Academy"
  const ageLabel = program.ageGroup.replace(/\s*–\s*/g, "–");
  const title = `${ageLabel} Soccer Program in Markham | Excel Pro Academy`;
  const description =
    PROGRAM_DESCRIPTIONS[program.slug] ??
    `${program.title} — youth soccer training in Markham, Ontario for ages 5-18 at Excel Pro Soccer Academy, serving families across the GTA.`;
  const canonicalUrl = `${SITE_URL}/program/${program.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      siteName: "Excel Pro Soccer Academy",
      images: [
        {
          url: program.team_image,
          width: 1200,
          height: 630,
          alt: `Excel Pro ${ageLabel} players training in Markham`,
        },
      ],
    },
  };
}

const ProgramPage: NextPage<ProgramPageProps> = ({ params }) => {
  const decodedSlug = decodeSlug(params.slug);

  const validFormat = /^u\d+-u\d+$/i.test(decodedSlug);
  if (!validFormat) {
    return notFound();
  }

  const program = resolveProgram(params.slug);

  if (!program) {
    return redirect("/program");
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Programs",
        item: `${SITE_URL}/program`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: program.title,
        item: `${SITE_URL}/program/${program.slug}`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-gray-50 py-36 lg:py-28 md:py-28 sm:py-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProgramDetails program={program} decodedSlug={decodedSlug} />
    </main>
  );
};

export default ProgramPage;
