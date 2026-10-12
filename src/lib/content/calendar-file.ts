import type { CouncilEvent } from "./types";
import { eventKey } from "./event-links";
const escape = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
const utc = (value: string) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
function fold(value: string) {
  const lines: string[] = [];
  let line = "";
  let bytes = 0;
  for (const char of value) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > 75) {
      lines.push(line);
      line = " ";
      bytes = 1;
    }
    line += char;
    bytes += size;
  }
  lines.push(line);
  return lines.join("\r\n");
}
export function calendarFile(event: CouncilEvent, now = new Date()) {
  const day = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "America/Chicago",
    })
      .format(date)
      .replace(/-/g, "");
  const start = event.allDay
    ? `DTSTART;VALUE=DATE:${day(new Date(event.start))}`
    : `DTSTART:${utc(event.start)}`;
  let end = event.end ? `DTEND:${utc(event.end)}` : "";
  if (event.allDay) {
    const value = day(new Date(event.start));
    const date = new Date(
      Date.UTC(
        Number(value.slice(0, 4)),
        Number(value.slice(4, 6)) - 1,
        Number(value.slice(6, 8)) + 1,
      ),
    );
    const supplied = event.end ? day(new Date(event.end)) : "";
    end = `DTEND;VALUE=DATE:${supplied > value ? supplied : date.toISOString().slice(0, 10).replace(/-/g, "")}`;
  }
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SMU CGC//Council Events//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${eventKey(event)}@cgc.smu.edu`,
      `DTSTAMP:${utc(now.toISOString())}`,
      start,
      end,
      `SUMMARY:${escape(event.title)}`,
      `LOCATION:${escape(event.location)}`,
      `DESCRIPTION:${escape(event.description)}`,
      event.registration
        ? `URL:${event.registration.replace(/[\r\n]/g, "")}`
        : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .map(fold)
      .join("\r\n") + "\r\n"
  );
}
