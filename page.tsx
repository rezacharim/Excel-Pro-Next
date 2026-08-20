import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NewsPost from "@/components/template/NewsPost/NewsPost";
import { getPostBySlug, CATEGORY_LABELS } from "@/services/news";

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
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return { title: "Post not found | Excel Pro Soccer Academy" };
  }

  const summary =
    post.body?.trim().replace(/\s+/g, " ") ||
    `${CATEGORY_LABELS[post.category] ?? "News"} from Excel Pro Soccer Academy.`;

  return {
    title: `${post.title} | Excel Pro Soccer Academy`,
    description: summary.slice(0, 200),
    alternates: { canonical: `${SITE}/announcements/${post.slug}` },
    openGraph: {
      title: post.title,
      description: summary.slice(0, 200),
      type: "article",
      url: `${SITE}/announcements/${post.slug}`,
      siteName: "Excel Pro Soccer Academy",
      // A shared match report should preview with the match photo, not the
      // generic academy card.
      images: [{ url: absolute(post.imageUrl), alt: post.title }],
    },
  };
}

const NewsPostPage = async ({ params }: Params) => {
  const post = await getPostBySlug(params.slug);
  // A hidden or deleted post 404s rather than rendering an empty shell, so a
  // stale link does not look like a broken page.
  if (!post) notFound();
  return <NewsPost post={post} />;
};

export default NewsPostPage;
