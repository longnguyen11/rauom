import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/menu", "/menu-assets"],
        disallow: ["/", "/admin", "/api", "/checkout", "/dishes"],
      },
    ],
    sitemap: "https://rau-om.caycham1.workers.dev/sitemap.xml",
  };
}
