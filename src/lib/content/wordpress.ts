import "server-only";
import { cache } from "react";
import { cleanHtml, parseCalendarEvent, plainText, safeUrl } from "./adapters";
import type { Announcement, CouncilEvent } from "./types";
import { announcementParts } from "./flyer";

type WordPressPost = {
  id: number;
  slug: string;
  date: string;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
};
export const enabled = () => process.env.WORDPRESS_ENABLED !== "false";
function endpoint(resource: string, params: Record<string, string>) {
  const base =
    process.env.WORDPRESS_API_URL ||
    `${(process.env.WORDPRESS_URL || "https://blog.smu.edu/chemgrads").replace(/\/$/, "")}/wp-json/wp/v2/`;
  const url = new URL(base);
  if (url.protocol !== "https:")
    throw new Error("WordPress endpoint must use HTTPS");
  if (url.searchParams.has("rest_route"))
    url.searchParams.set(
      "rest_route",
      `${url.searchParams.get("rest_route")!.replace(/\/$/, "")}/${resource}`,
    );
  else url.pathname = `${url.pathname.replace(/\/$/, "")}/${resource}`;
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  return url;
}
async function request(
  resource: string,
  params: Record<string, string>,
): Promise<WordPressPost[]> {
  const response = await fetch(endpoint(resource, params), {
    next: { revalidate: 300, tags: ["wordpress-content"] },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`WordPress returned ${response.status}`);
  const json: unknown = await response.json();
  if (!Array.isArray(json))
    throw new Error("WordPress did not return a collection");
  return json.filter(
    (post): post is WordPressPost =>
      !!post &&
      typeof post.id === "number" &&
      typeof post.slug === "string" &&
      typeof post.date === "string" &&
      typeof post.link === "string" &&
      typeof post.title?.rendered === "string" &&
      typeof post.excerpt?.rendered === "string" &&
      typeof post.content?.rendered === "string",
  );
}
export const getOfficerMedia = cache(
  async (html: string): Promise<Record<string, string>> => {
    const decoded = html.replace(/&#8221;|&#8243;|&quot;/g, '"');
    const ids = [
      ...decoded.matchAll(/\[vc_single_image[^\]]*image=["']?(\d+)/g),
    ].map((match) => match[1]);
    if (!ids.length) return {};
    const response = await fetch(
      endpoint("media", {
        include: [...new Set(ids)].join(","),
        per_page: "100",
      }),
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) return {};
    const media: unknown = await response.json();
    if (!Array.isArray(media)) return {};
    return Object.fromEntries(
      media
        .filter(
          (item) =>
            typeof item.id === "number" &&
            typeof item.source_url === "string" &&
            safeUrl(item.source_url) &&
            new URL(item.source_url).hostname === "blog.smu.edu",
        )
        .map((item) => [String(item.id), item.source_url]),
    );
  },
);
export const getWordPressPage = cache(async (slug: string) => {
  if (!enabled()) return null;
  const pages = await request("pages", { slug, per_page: "1" });
  return pages[0]?.content.rendered ?? null;
});
function normalize(post: WordPressPost): Announcement {
  const parts = announcementParts(post.content.rendered);
  return {
    id: post.id,
    historical: Date.parse(post.date) < Date.now() - 365 * 24 * 60 * 60 * 1000,
    slug: post.slug,
    title: plainText(post.title.rendered),
    date: post.date.slice(0, 10),
    excerpt: plainText(post.excerpt.rendered),
    html: cleanHtml(parts.body),
    flyer: parts.flyer,
    flyerAlt: parts.flyerAlt,
    registration: parts.registration,
    url: safeUrl(post.link) || "https://blog.smu.edu/chemgrads/announcements/",
    local: true,
  };
}
export const getWordPressPosts = cache(async () =>
  (
    await request("posts", { per_page: "12", orderby: "date", order: "desc" })
  ).map(normalize),
);
export const getWordPressPost = cache(async (slug: string) => {
  const posts = await request("posts", { slug, per_page: "1" });
  return posts[0] ? normalize(posts[0]) : null;
});
export const getCalendarEvents = cache(async (): Promise<CouncilEvent[]> => {
  const monthParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(monthParts.find((part) => part.type === "year")!.value);
  const month =
    Number(monthParts.find((part) => part.type === "month")!.value) - 1;
  const apiRoot = new URL(
    process.env.WORDPRESS_URL || "https://blog.smu.edu/chemgrads",
  );
  apiRoot.pathname = `${apiRoot.pathname.replace(/\/$/, "")}/wp-json/calendar-plus/v1/events`;
  const requests = Array.from({ length: 8 }, (_, index) => {
    const date = new Date(Date.UTC(year, month + index - 2, 1));
    const url = new URL(apiRoot);
    url.searchParams.set("month", String(date.getUTCMonth() + 1));
    url.searchParams.set("year", String(date.getUTCFullYear()));
    return (async () => {
      const response = await fetch(url, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Calendar returned ${response.status}`);
      const json: unknown = await response.json();
      if (!Array.isArray(json))
        throw new Error("Calendar returned invalid data");
      return json
        .map(parseCalendarEvent)
        .filter((event): event is CouncilEvent => event !== null);
    })();
  });
  const months = await Promise.all(requests);
  const unique = new Map<string, CouncilEvent>();
  months
    .flat()
    .forEach((event) =>
      unique.set(`${event.url || event.title}-${event.start}`, event),
    );
  return [...unique.values()];
});
