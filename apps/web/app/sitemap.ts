import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/mdx";
import { GAMES, TOOLS, SITE } from "@/lib/constants";
import { SUPPORTED_LANGUAGES, DEFAULT_LANG } from "@/lib/i18n/languages";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE.url;
  // 사이트맵 날짜를 고정하여 불필요한 크롤링 방지
  const SITEMAP_DATE = new Date("2026-03-10");

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: SITEMAP_DATE, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: SITEMAP_DATE, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/game`, lastModified: SITEMAP_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/resume`, lastModified: SITEMAP_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: SITEMAP_DATE, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: SITEMAP_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: SITEMAP_DATE, changeFrequency: "yearly", priority: 0.3 },
  ];

  const blogPages: MetadataRoute.Sitemap = (await getAllPosts()).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const gamePages: MetadataRoute.Sitemap = GAMES.map((game) => ({
    url: `${baseUrl}/game/${game.slug}`,
    lastModified: SITEMAP_DATE,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const toolsPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/tools`, lastModified: SITEMAP_DATE, changeFrequency: "monthly" as const, priority: 0.7 },
    ...TOOLS.map((tool) => ({
      url: `${baseUrl}/tools/${tool.slug}`,
      lastModified: SITEMAP_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  const resumePages: MetadataRoute.Sitemap = SUPPORTED_LANGUAGES
    .filter((lang) => lang !== DEFAULT_LANG)
    .map((lang) => ({
      url: `${baseUrl}/resume/${lang}`,
      lastModified: SITEMAP_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...staticPages, ...blogPages, ...gamePages, ...toolsPages, ...resumePages];
}
