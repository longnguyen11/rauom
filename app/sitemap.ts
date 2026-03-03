import type { MetadataRoute } from "next";

import { getSeoDishSlugs } from "@/lib/dishes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://rau-om.example.com";
  const now = new Date();

  const staticRoutes = [
    "",
    "/archive",
    "/checkout",
    "/how-ordering-works",
    "/allergens",
    "/delivery-fees",
    "/fresh-cook-policy",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const dishSlugs = await getSeoDishSlugs();
  const dishRoutes = dishSlugs.map((slug) => ({
    url: `${baseUrl}/dishes/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...dishRoutes];
}
