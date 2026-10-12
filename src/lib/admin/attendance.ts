import { load } from "cheerio";
import { escapeHtml } from "./content";
import { AdminError } from "./errors";
import { editablePage, wordpressRequest, type EditablePost } from "./wordpress";
import type { AdminSession } from "./session-codec";
export type Attendance = {
  id: string;
  title: string;
  registered?: number;
  attended?: number;
};
export function attendanceTable(rows: Attendance[]) {
  return `<table><thead><tr><th>ID</th><th>Title</th><th>Registered</th><th>Attended</th></tr></thead><tbody>${rows.map((r) => `<tr>${[r.id, r.title, r.registered ?? "", r.attended ?? ""].map((v) => `<td>${escapeHtml(String(v))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
export function parseAttendance(html: string): Attendance[] {
  const $ = load(html);
  return $("tbody tr")
    .toArray()
    .map((row) => {
      const c = $(row).find("td"),
        number = (i: number) =>
          /^\d{1,6}$/.test(c.eq(i).text()) && Number(c.eq(i).text()) <= 100000
            ? Number(c.eq(i).text())
            : undefined;
      return {
        id: c.eq(0).text(),
        title: c.eq(1).text(),
        registered: number(2),
        attended: number(3),
      };
    })
    .filter((r) => /^[a-zA-Z0-9_-]{1,100}$/.test(r.id) && r.title);
}
export function attendanceForm(form: FormData): Attendance[] {
  const ids = form.getAll("eventId");
  if (ids.length > 200)
    throw new AdminError("validation", "Maximum 200 tracked events.");
  return ids.map((v, i) => {
    const id = String(v),
      title = String(form.getAll("eventTitle")[i] || "");
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id) || !title || title.length > 200)
      throw new AdminError("validation", "Choose valid events.");
    const count = (key: string) => {
      const raw = String(form.getAll(key)[i] || "");
      if (!raw) return undefined;
      if (!/^\d{1,6}$/.test(raw) || Number(raw) > 100000)
        throw new AdminError(
          "validation",
          "Counts must be whole numbers from 0 to 100,000.",
        );
      return Number(raw);
    };
    return {
      id,
      title,
      registered: count("registered"),
      attended: count("attended"),
    };
  });
}
export async function saveAttendanceRecord(
  session: AdminSession,
  form: FormData,
) {
  const rows = attendanceForm(form),
    page = await editablePage(session, "cgc-event-attendance");
  if ((page?.modified_gmt || "new") !== String(form.get("version") || ""))
    throw new AdminError("conflict", "Counts changed. Reload before saving.");
  return wordpressRequest<EditablePost>(
    session,
    page ? `pages/${page.id}` : "pages",
    {
      method: "POST",
      body: {
        slug: "cgc-event-attendance",
        title: "CGC Event Attendance",
        content: attendanceTable(rows),
        status: "private",
      },
    },
  );
}
