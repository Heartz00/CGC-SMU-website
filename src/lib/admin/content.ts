import { load } from "cheerio";
import { safeUrl, validDate } from "../content/adapters";
import type { Officer, CouncilEvent } from "../content/types";
import { AdminError } from "./errors";
import { wordpressImage } from "../content/flyer";
import { validTermDate } from "../content/council-history";
export function announcementContent(
  body: string,
  flyer: string,
  registration: string,
  title: string,
) {
  if (
    (flyer && !wordpressImage(flyer)) ||
    (registration && !safeUrl(registration))
  )
    throw new AdminError(
      "validation",
      "Choose a WordPress image and a secure registration link.",
    );
  return `${flyer ? `<figure data-cgc-flyer="true"><img src="${escapeHtml(flyer)}" alt="${escapeHtml(title)} flyer" /></figure>` : ""}${body}${registration ? `<p data-cgc-registration="true"><a href="${escapeHtml(registration)}">Register for this event</a></p>` : ""}`;
}
export function textField(form: FormData, name: string, max = 5000) {
  const value = form.get(name);
  if (typeof value !== "string" || value.length > max)
    throw new AdminError(
      "validation",
      "Please check the required fields and content length.",
    );
  return value.trim();
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
export function plainParagraphs(value: string) {
  return value
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}
export function editableText(html: string) {
  const $ = load(html.replace(/\[\/?vc_[^\]]*\]/g, ""));
  $("br").replaceWith("\n");
  $("p,h2,h3,h4,li").each((_, node) => {
    $(node).append("\n\n");
  });
  return $.text().trim();
}
export function needsFormattingConfirmation(html: string) {
  const $ = load(html, null, false);
  return $("*")
    .toArray()
    .some((node) => {
      if (!("name" in node) || !("attribs" in node)) return false;
      return (
        !["p", "br"].includes(node.name) ||
        Object.keys(node.attribs || {}).length > 0
      );
    });
}
function table(headers: string[], rows: string[][]) {
  return `<!-- wp:table --><figure class="wp-block-table"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></figure><!-- /wp:table -->`;
}
export function officerForm(form: FormData): Officer[] {
  const names = form.getAll("name");
  if (names.length > 30)
    throw new AdminError(
      "validation",
      "A maximum of 30 officers is supported.",
    );
  const get = (key: string, i: number, max = 5000) => {
    const v = form.getAll(key)[i];
    if (typeof v !== "string" || v.length > max)
      throw new AdminError("validation", "Please check all officer fields.");
    return v.trim();
  };
  return names.map((_, i) => {
    const name = get("name", i, 150);
    const role = get("role", i, 150);
    const email = get("email", i, 254);
    const photo = get("photo", i, 1000);
    const termStart = String(form.getAll("termStart")[i] || "").trim();
    const termEnd = String(form.getAll("termEnd")[i] || "").trim();
    if (
      !name ||
      !role ||
      ((termStart || termEnd) &&
        (!validTermDate(termStart) ||
          !validTermDate(termEnd) ||
          termStart > termEnd)) ||
      (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
      (photo && (!safeUrl(photo) || new URL(photo).hostname !== "blog.smu.edu"))
    )
      throw new AdminError(
        "validation",
        "Each officer needs a name and role, a valid email if provided, and a public WordPress photo URL.",
      );
    return {
      name,
      role,
      email,
      photo,
      bio: get("bio", i),
      term: get("term", i, 100),
      ...(termStart ? { termStart, termEnd } : {}),
    };
  });
}
export function officersTable(officers: Officer[]) {
  return table(
    ["Name", "Role", "Bio", "Term", "Email", "Photo", "Term start", "Term end"],
    officers.map((o) => [
      o.name,
      o.role,
      o.bio,
      o.term,
      o.email || "",
      o.photo || "",
      o.termStart || "",
      o.termEnd || "",
    ]),
  );
}
export function eventsForm(form: FormData): CouncilEvent[] {
  const titles = form.getAll("title");
  if (titles.length > 80)
    throw new AdminError("validation", "A maximum of 80 events is supported.");
  const get = (key: string, i: number, max = 5000) => {
    const v = form.getAll(key)[i];
    if (typeof v !== "string" || v.length > max)
      throw new AdminError("validation", "Please check all event fields.");
    return v.trim();
  };
  return titles.map((_, i) => {
    const title = get("title", i, 200),
      start = get("start", i, 40),
      end = get("end", i, 40),
      registration = get("registration", i, 1000);
    if (
      !title ||
      !validDate(start) ||
      (end && (!validDate(end) || Date.parse(end) < Date.parse(start))) ||
      (registration && !safeUrl(registration))
    )
      throw new AdminError(
        "validation",
        "Events need a title, dates with explicit timezones, and a secure registration URL if supplied.",
      );
    return {
      title,
      start,
      id:
        typeof form.getAll("eventId")[i] === "string"
          ? String(form.getAll("eventId")[i]).slice(0, 100)
          : undefined,
      end: end || undefined,
      location: get("location", i, 300),
      description: get("description", i),
      registration,
      flyer: (() => {
        const value = form.getAll("flyer")[i];
        if (value === undefined || value === "") return undefined;
        if (
          typeof value !== "string" ||
          value.length > 1000 ||
          !wordpressImage(value)
        )
          throw new AdminError("validation", "Choose a WordPress flyer image.");
        return value;
      })(),
    };
  });
}
export function eventsTable(events: CouncilEvent[]) {
  return table(
    [
      "Title",
      "Start",
      "End",
      "Location",
      "Description",
      "Registration",
      "Flyer",
      "ID",
    ],
    events.map((e) => [
      e.title,
      e.start,
      e.end || "",
      e.location,
      e.description,
      e.registration || "",
      e.flyer || "",
      e.id || "",
    ]),
  );
}
