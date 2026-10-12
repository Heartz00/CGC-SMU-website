import { load } from "cheerio";
import type { Officer } from "./types";
import { wordpressImage } from "./flyer";
export type CouncilTerm = {
  id: string;
  label: string;
  start: string;
  end: string;
  officers: Officer[];
};
export function validTermDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function councilTermId(label: string, start: string, end: string) {
  let hash = 2166136261;
  for (const char of `${label}|${start}|${end}`)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `term-${(hash >>> 0).toString(16)}`;
}
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export function historyTable(terms: CouncilTerm[]) {
  const rows = terms.flatMap((term) =>
    term.officers.map((officer) => [
      term.label,
      term.start,
      term.end,
      officer.name,
      officer.role,
      officer.bio,
      officer.email || "",
      officer.photo || "",
      officer.photoPosition || "center",
    ]),
  );
  return `<table><thead><tr>${["Term", "Start", "End", "Name", "Role", "Bio", "Email", "Photo", "Photo position"].map((key) => `<th>${key}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((value) => `<td>${escape(value)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
export function parseCouncilHistory(html: string): CouncilTerm[] {
  const $ = load(html);
  const terms = new Map<string, CouncilTerm>();
  $("table").each((_, table) => {
    const rows = $(table).find("tr").toArray();
    const heads = $(rows[0])
      .find("th,td")
      .toArray()
      .map((cell) => $(cell).text().trim());
    if (
      !["Term", "Start", "End", "Name", "Role"].every((key) =>
        heads.includes(key),
      )
    )
      return;
    for (const row of rows.slice(1)) {
      const cells = $(row).find("td");
      const get = (key: string) =>
        heads.includes(key) ? cells.eq(heads.indexOf(key)).text().trim() : "";
      const label = get("Term"),
        start = get("Start"),
        end = get("End");
      if (
        !label ||
        !validTermDate(start) ||
        !validTermDate(end) ||
        start > end ||
        !get("Name") ||
        !get("Role")
      )
        continue;
      const id = councilTermId(label, start, end);
      const term = terms.get(id) || { id, label, start, end, officers: [] };
      const email = get("Email");
      term.officers.push({
        name: get("Name"),
        role: get("Role"),
        bio: get("Bio"),
        term: label,
        termStart: start,
        termEnd: end,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
        photo: wordpressImage(get("Photo")),
        ...(["top", "bottom"].includes(get("Photo position"))
          ? { photoPosition: get("Photo position") as Officer["photoPosition"] }
          : {}),
      });
      terms.set(id, term);
    }
  });
  return [...terms.values()].sort((a, b) => b.end.localeCompare(a.end));
}
