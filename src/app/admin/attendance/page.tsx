import { AdminShell } from "@/components/admin/shared";
import { SavedForm } from "@/components/admin/saved-form";
import { SubmitButton } from "@/components/admin/submit";
import { requireAdmin } from "@/lib/admin/auth";
import { editablePage } from "@/lib/admin/wordpress";
import { getEvents } from "@/lib/content";
import { eventKey } from "@/lib/content/event-links";
import { parseAttendance, type Attendance } from "@/lib/admin/attendance";
import { saveAttendance } from "../actions";
export default async function Counts() {
  const { session } = await requireAdmin("publish_pages");
  const [page, events] = await Promise.all([
    editablePage(session, "cgc-event-attendance"),
    getEvents(),
  ]);
  const records = new Map<string, Attendance>(
    parseAttendance(page?.content.rendered || "").map((r) => [r.id, r]),
  );
  events.items.forEach((e) => {
    const id = eventKey(e);
    if (!records.has(id)) records.set(id, { id, title: e.title });
  });
  return (
    <AdminShell
      title="Know your turnout."
      description="Enter registration and attendance totals from your organizer dashboard. Counts remain in the admin."
    >
      <SavedForm action={saveAttendance}>
        <input
          type="hidden"
          name="version"
          value={page?.modified_gmt || "new"}
        />
        {[...records.values()].map((r) => (
          <details key={r.id} className="admin-record-group">
            <summary>{r.title}</summary>
            <div className="admin-editor">
              <input type="hidden" name="eventId" value={r.id} />
              <input type="hidden" name="eventTitle" value={r.title} />
              <div className="admin-fields">
                <label className="admin-field">
                  <span>Registered</span>
                  <input
                    name="registered"
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    defaultValue={r.registered ?? ""}
                  />
                </label>
                <label className="admin-field">
                  <span>Attended</span>
                  <input
                    name="attended"
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    defaultValue={r.attended ?? ""}
                  />
                </label>
              </div>
            </div>
          </details>
        ))}
        {!records.size && <p>Add an event before tracking counts.</p>}
        <SubmitButton />
      </SavedForm>
    </AdminShell>
  );
}
