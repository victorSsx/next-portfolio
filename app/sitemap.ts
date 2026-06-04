import type { MetadataRoute } from "next";

const SITE_URL = "https://next-portfolio-navy-five-46.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/projetos`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];
}
