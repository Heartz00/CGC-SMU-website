import { load } from "cheerio";
import sanitizeHtml from "sanitize-html";
import type { CouncilEvent, Officer } from "./types";
import { wordpressImage } from "./flyer";
import { validTermDate } from "./council-history";

export function safeUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function stripShortcodes(html: string): string {
  return html.replace(/\[\/?(?:vc_|calendarp|calendar_plus)[^\]]*\]/g, "");
}
export function plainText(html: string): string {
  return load(stripShortcodes(html)).text().replace(/\s+/g, " ").trim();
}
export function cleanHtml(html: string): string {
  return sanitizeHtml(stripShortcodes(html), {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "h2",
      "h3",
      "h4",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: { a: ["href", "title", "rel"] },
    allowedSchemes: ["https", "http", "mailto"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer" },
      }),
    },
  });
}
function rows(html: string, required: string[]): Record<string, string>[] {
  const $ = load(html);
  const result: Record<string, string>[] = [];
  $("table").each((_, table) => {
    const tableRows = $(table).find("tr").toArray();
    const headers = $(tableRows[0])
      .find("th,td")
      .toArray()
      .map((cell) => $(cell).text().trim().toLowerCase());
    if (!required.every((key) => headers.includes(key))) return;
    for (const row of tableRows.slice(1)) {
      const record: Record<string, string> = {};
      $(row)
        .find("th,td")
        .each((i, cell) => {
          const key = headers[i];
          if (!key) return;
          const link = $(cell).find("a").attr("href");
          const image = $(cell).find("img").attr("src");
          record[key] = (
            (key === "photo" ? image : undefined) ||
            (["photo", "registration", "email"].includes(key)
              ? link
              : undefined) ||
            $(cell).text()
          ).trim();
        });
      result.push(record);
    }
  });
  return result;
}
export function parseOfficers(html: string): Officer[] {
  return rows(html, ["name", "role"])
    .filter((row) => row.name && row.role)
    .map((row) => {
      const email = (row.email || "").replace(/^mailto:/i, "");
      const photo = safeUrl(row.photo || "");
      return {
        name: row.name,
        role: row.role,
        bio: row.bio || "",
        term: row.term || "",
        ...(validTermDate(row["term start"] || "") &&
        validTermDate(row["term end"] || "") &&
        row["term start"] <= row["term end"]
          ? { termStart: row["term start"], termEnd: row["term end"] }
          : {}),
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
        photo:
          photo && new URL(photo).hostname === "blog.smu.edu"
            ? photo
            : undefined,
      };
    });
}
// Compatibility adapter for the existing WPBakery page. Prefer a standard table
// for future edits; no officer names or positions are embedded in the UI.
export function parseLegacyOfficers(
  html: string,
  media: Record<string, string> = {},
): Officer[] {
  const decoded = load(html).html();
  const sections = [...decoded.matchAll(/<strong[^>]*>([^<]+:)<\/strong>/gi)];
  return sections.flatMap((match, index) => {
    const start = match.index! + match[0].length;
    const end = sections[index + 1]?.index ?? decoded.length;
    const raw = decoded.slice(start, end).split("[/vc_column_text]")[0];
    const $ = load(stripShortcodes(raw));
    $("br").replaceWith("\n");
    const text = $.text().replace(/\s+/g, " ").trim();
    const nameMatch = text.match(/^(.+?)\s*\(([^)]+@[^)]+)\)/);
    if (!nameMatch) return [];
    const email = $("a[href^='mailto:']")
      .first()
      .attr("href")
      ?.replace(/^mailto:/, "");
    const role = plainText(match[1])
      .replace(/:$/, "")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
    const prefix = decoded.slice(sections[index - 1]?.index ?? 0, match.index);
    const imageMatches = [...prefix.matchAll(/\[vc_single_image[^\]]*\]/g)];
    const imageId = imageMatches.at(-1)?.[0].match(/image=["”″']?(\d+)/)?.[1];
    return [
      {
        name: nameMatch[1].trim(),
        role,
        email,
        photo: imageId ? media[imageId] : undefined,
        bio: text.slice(nameMatch[0].length).trim(),
        term: "",
      },
    ];
  });
}
export function parseEvents(html: string): CouncilEvent[] {
  return rows(html, ["title", "start", "location"])
    .filter((row) => row.title && validDate(row.start))
    .map((row) => ({
      title: row.title,
      id: row.id || undefined,
      start: row.start,
      end:
        validDate(row.end) && Date.parse(row.end) >= Date.parse(row.start)
          ? row.end
          : undefined,
      location: row.location || "Location to be announced",
      description: row.description || "",
      registration: safeUrl(row.registration || ""),
      flyer: wordpressImage(row.flyer || ""),
    }));
}
export function validDate(value?: string): value is string {
  return (
    !!value &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) &&
    Number.isFinite(Date.parse(value))
  );
}
export function partitionEvents(events: CouncilEvent[], now = Date.now()) {
  const upcoming = events
    .filter((event) => Date.parse(event.end || event.start) >= now)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const past = events
    .filter((event) => Date.parse(event.end || event.start) < now)
    .sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
  return { upcoming, past };
}
export function parseCalendarEvent(value: unknown): CouncilEvent | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.title !== "string" || typeof item.desc !== "string")
    return null;
  const calendars = item.calendars as
    { google?: { url?: unknown } } | undefined;
  const calendarUrl = calendars?.google?.url;
  if (typeof calendarUrl !== "string" || !safeUrl(calendarUrl)) return null;
  // Calendar+ supplies its timezone conversion through the Google Calendar link.
  // Use those UTC values, rather than guessing DST from naive local date fields.
  const dates = new URL(calendarUrl).searchParams.get("dates")?.split("/");
  if (!dates || dates.length !== 2) return null;
  const iso = (date: string) => {
    const match = date.match(
      /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z)?$/,
    );
    return match
      ? `${match[1]}-${match[2]}-${match[3]}T${match[4] || "12"}:${match[5] || "00"}:${match[6] || "00"}Z`
      : "";
  };
  const start = iso(dates[0]);
  const end = iso(dates[1]);
  if (
    !validDate(start) ||
    !validDate(end) ||
    Date.parse(end) < Date.parse(start)
  )
    return null;
  const location =
    typeof item.location === "string"
      ? plainText(item.location)
      : "Location to be announced";
  return {
    title: plainText(item.title),
    start,
    end,
    location,
    description: plainText(item.desc),
    url: typeof item.url === "string" ? safeUrl(item.url) : undefined,
    allDay: item.allDay === true,
  };
}
