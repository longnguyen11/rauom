import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://rau-om.caycham1.workers.dev";
  const now = new Date();

  return [
    {
      url: `${baseUrl}/menu`,
    lastModified: now,
    changeFrequency: "weekly" as const,
      priority: 1,
    },
  ];
}
