import { load } from "cheerio";
import type { CouncilEvent } from "../content/types";
import { validDate, safeUrl } from "../content/adapters";
import { wordpressImage } from "../content/flyer";
export type PublishResult = {
  fields?: Record<string, string>;
  links?: { href: string; label: string }[];
  message: string;
  success?: boolean;
  postId?: number;
  version?: string;
  eventSaved?: boolean;
};
export function isCombinedUpdate(html: string) {
  return load(html)("[data-cgc-update]").length > 0;
}
export function eventDraft(html: string): CouncilEvent | undefined {
  const value = load(html)("[data-cgc-event]").attr("data-cgc-event");
  try {
    const event = JSON.parse(decodeURIComponent(value || ""));
    if (
      typeof event.title !== "string" ||
      !validDate(event.start) ||
      typeof event.location !== "string" ||
      typeof event.description !== "string" ||
      (event.registration && !safeUrl(event.registration)) ||
      (event.flyer && !wordpressImage(event.flyer))
    )
      return undefined;
    return event;
  } catch {
    return undefined;
  }
}
export function draftMarker(event: CouncilEvent) {
  return `<div data-cgc-event="${encodeURIComponent(JSON.stringify(event))}" hidden></div>`;
}
export function upsertEvent(events: CouncilEvent[], event: CouncilEvent) {
  const existing = events.findIndex((item) => item.id === event.id);
  return existing < 0
    ? [...events, event]
    : events.map((item, index) =>
        index === existing
          ? {
              ...event,
              ...(!event.status && item.status ? { status: item.status } : {}),
            }
          : item,
      );
}
