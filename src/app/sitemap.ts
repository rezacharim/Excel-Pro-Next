import { MetadataRoute } from "next";
import { programs } from "@/data/programs";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.excelproso.com";

  const staticRoutes = [
    "/",
    "/program",
    "/about-us",
    "/coaches",
    "/announcements",
    "/matchday",
    "/sponsors",
    "/contact-us",
  ];

  const programRoutes = programs.map((program) => `/program/${program.slug}`);

  const allRoutes = [...staticRoutes, ...programRoutes];

  return allRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));
}
