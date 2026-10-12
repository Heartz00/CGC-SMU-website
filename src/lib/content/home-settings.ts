import { load } from "cheerio";
import { validTermDate } from "./council-history";
export type HomeSettings = {
  featuredEvent?: string;
  featuredAnnouncement?: number;
  featuredUntil?: string;
};
export function parseHomeSettings(html: string): HomeSettings {
  const $ = load(html);
  const values = new Map<string, string>();
  $("tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    values.set(cells.eq(0).text().trim(), cells.eq(1).text().trim());
  });
  const event = values.get("Featured event") || "";
  const post = Number(values.get("Featured announcement") || "");
  return {
    featuredEvent: /^event-[a-zA-Z0-9_-]{1,100}$/.test(event)
      ? event
      : undefined,
    featuredAnnouncement:
      Number.isSafeInteger(post) && post > 0 ? post : undefined,
    ...(validTermDate(values.get("Featured until") || "")
      ? { featuredUntil: values.get("Featured until") }
      : {}),
  };
}
export function homeSettingsTable(settings: HomeSettings) {
  const event =
    settings.featuredEvent &&
    /^event-[a-zA-Z0-9_-]{1,100}$/.test(settings.featuredEvent)
      ? settings.featuredEvent
      : "";
  const post =
    Number.isSafeInteger(settings.featuredAnnouncement) &&
    (settings.featuredAnnouncement || 0) > 0
      ? String(settings.featuredAnnouncement)
      : "";
  return `<table><thead><tr><th>Setting</th><th>Value</th></tr></thead><tbody><tr><td>Featured event</td><td>${event}</td></tr><tr><td>Featured announcement</td><td>${post}</td></tr><tr><td>Featured until</td><td>${validTermDate(settings.featuredUntil || "") ? settings.featuredUntil : ""}</td></tr></tbody></table>`;
}
export function activeHomeSettings(settings: HomeSettings, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Chicago",
  }).format(now);
  return settings.featuredUntil && today > settings.featuredUntil
    ? { ...settings, featuredAnnouncement: undefined }
    : settings;
}
export function featureFirst<T>(
  items: T[],
  selected: string | number | undefined,
  key: (item: T) => string | number,
) {
  const featured = items.find((item) => key(item) === selected);
  return featured
    ? [featured, ...items.filter((item) => item !== featured)]
    : items;
}
