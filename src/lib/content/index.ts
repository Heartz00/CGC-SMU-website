import "server-only";
import officerData from "@/content/officers.json";
import eventData from "@/content/events.json";
import { facultySlug, facultyPositions } from "./faculty";
import {
  parseEvents,
  parseOfficers,
  parseLegacyOfficers,
  validDate,
} from "./adapters";
import {
  enabled,
  getCalendarEvents,
  getOfficerMedia,
  getWordPressPage,
  getWordPressPosts,
  getLinkedPostEvents,
} from "./wordpress";
import type {
  Announcement,
  ContentResult,
  CouncilEvent,
  Officer,
} from "./types";

const archive: Announcement[] = [
  {
    id: -1,
    slug: "october-2024",
    title: "October 2024 announcements",
    date: "2024-10-14",
    excerpt:
      "An update from the council archive, including outreach, social events, and council meetings.",
    url: "https://blog.smu.edu/chemgrads/category/uncategorized/",
  },
  {
    id: -2,
    slug: "september-2024",
    title: "September 2024 announcements",
    date: "2024-09-23",
    excerpt:
      "From the archive: community activities, seminar planning, and outreach opportunities.",
    url: "https://blog.smu.edu/chemgrads/category/uncategorized/",
  },
];
export async function getFaculty(): Promise<ContentResult<Officer>> {
  try {
    const html = await getWordPressPage(facultySlug);
    return {
      items:
        html === null
          ? []
          : parseOfficers(html).filter((person) =>
              facultyPositions.some(
                (position) => position.role === person.role,
              ),
            ),
      source: "wordpress",
      unavailable: false,
    };
  } catch {
    return { items: [], source: "fallback", unavailable: enabled() };
  }
}
export async function getOfficers(): Promise<ContentResult<Officer>> {
  try {
    const managedHtml = await getWordPressPage(
      process.env.WORDPRESS_MANAGED_OFFICERS_SLUG || "cgc-officers",
    );
    if (managedHtml !== null)
      return {
        items: parseOfficers(managedHtml),
        source: "wordpress",
        unavailable: false,
      };
    const html = await getWordPressPage(
      process.env.WORDPRESS_OFFICERS_SLUG || "officers",
    );
    if (html !== null) {
      const table = parseOfficers(html);
      let media: Record<string, string> = {};
      try {
        media = await getOfficerMedia(html);
      } catch {
        /* Names and contact information can render without photos. */
      }
      return {
        items: table.length ? table : parseLegacyOfficers(html, media),
        source: "wordpress",
        unavailable: false,
      };
    }
  } catch {
    console.warn("Officer content unavailable; using local fallback.");
  }
  const items = (officerData as Officer[]).filter(
    (item) => item.name && item.role,
  );
  return { items, source: "fallback", unavailable: enabled() };
}
export async function getEvents(): Promise<ContentResult<CouncilEvent>> {
  try {
    const html = await getWordPressPage(
      process.env.WORDPRESS_EVENTS_SLUG || "events",
    );
    if (enabled()) {
      let calendar: CouncilEvent[] = [];
      let unavailable = false;
      try {
        calendar = await getCalendarEvents();
      } catch {
        unavailable = true;
      }
      let announced: CouncilEvent[] = [];
      try {
        announced = await getLinkedPostEvents();
      } catch {
        unavailable = true;
      }
      const managed = html !== null ? parseEvents(html) : [];
      const combined = [
        ...calendar,
        ...announced.filter(
          (event) => !managed.some((item) => item.id === event.id),
        ),
        ...managed,
      ];
      const unique = new Map<string, CouncilEvent>();
      combined.forEach((event) =>
        unique.set(`${event.title}-${event.start}`, event),
      );
      return { items: [...unique.values()], source: "wordpress", unavailable };
    }
  } catch {
    console.warn("Event content unavailable; using local fallback.");
  }
  return {
    items: (eventData as CouncilEvent[]).filter(
      (item) => item.title && validDate(item.start),
    ),
    source: "fallback",
    unavailable: enabled(),
  };
}
export async function getAnnouncements(): Promise<ContentResult<Announcement>> {
  if (enabled()) {
    try {
      return {
        items: await getWordPressPosts(),
        source: "wordpress",
        unavailable: false,
      };
    } catch {
      console.warn("News content unavailable; using archive links.");
    }
  }
  return { items: archive, source: "fallback", unavailable: enabled() };
}
