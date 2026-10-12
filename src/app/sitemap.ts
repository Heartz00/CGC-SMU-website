import type { MetadataRoute } from "next";
import { resources } from "@/lib/resources";
import { getAnnouncements, getEvents } from "@/lib/content";
import { eventPath } from "@/lib/content/event-links";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined);
  if (!origin) return [];
  const base = origin.replace(/\/$/, "");
  const [news, events] = await Promise.all([getAnnouncements(), getEvents()]);
  return [
    "",
    "/about",
    "/photos",
    "/executive-committee",
    "/executive-committee/history",
    "/events",
    "/news",
    "/resources",
    "/contact",
    ...events.items.map(eventPath),
    ...resources.map((item) => `/resources/${item.slug}`),
    ...news.items
      .filter((item) => item.local)
      .map((item) => `/news/${item.slug}`),
  ].map((path) => ({ url: `${base}${path}` }));
}
