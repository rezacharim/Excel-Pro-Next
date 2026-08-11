import { MetadataRoute } from "next";
import { programs } from "@/data/programs";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.excelproso.com";
  const lastModified = new Date().toISOString();

  /** Public static routes with per-page priorities. */
  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/program", priority: 0.9, changeFrequency: "monthly" },
    { path: "/register", priority: 0.8, changeFrequency: "monthly" },
    { path: "/about-us", priority: 0.7, changeFrequency: "monthly" },
    { path: "/coaches", priority: 0.7, changeFrequency: "monthly" },
    { path: "/announcements", priority: 0.7, changeFrequency: "weekly" },
    { path: "/matchday", priority: 0.7, changeFrequency: "weekly" },
    { path: "/contact-us", priority: 0.7, changeFrequency: "monthly" },
    { path: "/sponsors", priority: 0.6, changeFrequency: "monthly" },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${baseUrl}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })
  );

  const programEntries: MetadataRoute.Sitemap = programs.map((program) => ({
    url: `${baseUrl}/program/${program.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [...staticEntries, ...programEntries];
}
