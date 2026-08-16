import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CoachProfile from "@/components/template/CoachProfile/CoachProfile";
import { getCoachBySlug } from "@/services/coaches";

interface Params {
  params: { slug: string };
}

const SITE = "https://www.excelproso.com";

/** Absolute URL for a photo, so link previews resolve it. */
const absolute = (url: string | null | undefined): string =>
  !url
    ? `${SITE}/images/og/og-default.jpg`
    : url.startsWith("/")
      ? `${SITE}${url}`
      : url;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const coach = await getCoachBySlug(params.slug);
  if (!coach) {
    return { title: "Coach not found | Excel Pro Soccer Academy" };
  }

  const summary =
    coach.bio?.trim() ||
    `${coach.name} is ${coach.role} at Excel Pro Soccer Academy in Markham, Ontario.`;

  return {
    title: `${coach.name} — ${coach.role} | Excel Pro Soccer Academy`,
    description: summary.slice(0, 200),
    alternates: { canonical: `${SITE}/coaches/${coach.slug}` },
    openGraph: {
      title: `${coach.name} — ${coach.role}`,
      description: summary.slice(0, 200),
      type: "profile",
      url: `${SITE}/coaches/${coach.slug}`,
      siteName: "Excel Pro Soccer Academy",
      images: [
        {
          url: absolute(coach.imageUrl),
          alt: `${coach.name} — ${coach.role}, Excel Pro Soccer Academy`,
        },
      ],
    },
  };
}

const CoachProfilePage = async ({ params }: Params) => {
  const coach = await getCoachBySlug(params.slug);
  // A hidden or deleted coach 404s rather than rendering an empty shell, so a
  // stale link does not look like a broken page.
  if (!coach) notFound();
  return <CoachProfile coach={coach} />;
};

export default CoachProfilePage;
