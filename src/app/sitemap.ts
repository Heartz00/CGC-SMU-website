import type { MetadataRoute } from "next";
import { resources } from "@/lib/resources";
import { getAnnouncements, getEvents } from "@/lib/content";
import { eventPath } from "@/lib/content/event-links";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.SITE_URL) return [];
  const base = process.env.SITE_URL.replace(/\/$/, "");
  const [news, events] = await Promise.all([getAnnouncements(), getEvents()]);
  return [
    "",
    "/about",
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
