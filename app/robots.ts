import type { MetadataRoute } from "next";

const SITE_URL = "https://next-portfolio-navy-five-46.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/vitrine"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
