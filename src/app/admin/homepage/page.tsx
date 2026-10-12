import { AdminShell } from "@/components/admin/shared";
import { SavedForm, FieldError } from "@/components/admin/saved-form";
import { SubmitButton } from "@/components/admin/submit";
import { requireAdmin } from "@/lib/admin/auth";
import { editablePage } from "@/lib/admin/wordpress";
import { getAnnouncements, getEvents } from "@/lib/content";
import { parseHomeSettings } from "@/lib/content/home-settings";
import { partitionEvents } from "@/lib/content/adapters";
import { eventSlug } from "@/lib/content/event-links";
import { saveHomeSettings } from "../actions";
export default async function Homepage() {
  const { session } = await requireAdmin("publish_pages");
  const [page, news, events] = await Promise.all([
    editablePage(session, "cgc-home-settings"),
    getAnnouncements(),
    getEvents(),
  ]);
  const settings = parseHomeSettings(page?.content.rendered || ""),
    upcoming = partitionEvents(events.items).upcoming;
  return (
    <AdminShell
      title="Make the homepage yours."
      description="Choose the event and announcement visitors see first."
    >
      <SavedForm action={saveHomeSettings} className="admin-editor">
        <input
          type="hidden"
          name="version"
          value={page?.modified_gmt || "new"}
        />
        <label className="admin-field">
          <span>Featured event</span>
          <select
            name="featuredEvent"
            defaultValue={
              upcoming.some(
                (event) => eventSlug(event) === settings.featuredEvent,
              )
                ? settings.featuredEvent
                : ""
            }
          >
            <option value="">Automatic · next upcoming event</option>
            {upcoming.map((event) => (
              <option key={eventSlug(event)} value={eventSlug(event)}>
                {event.title}
              </option>
            ))}
          </select>
          <FieldError name="featuredEvent" />
        </label>
        <label className="admin-field">
          <span>Featured announcement</span>
          <select
            name="featuredAnnouncement"
            defaultValue={
              news.items.some(
                (post) => post.id === settings.featuredAnnouncement,
              )
                ? String(settings.featuredAnnouncement)
                : ""
            }
          >
            <option value="">Automatic · latest announcement</option>
            {news.items
              .filter((post) => post.local)
              .map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
          </select>
          <FieldError name="featuredAnnouncement" />
        </label>
        <SubmitButton />
        <p className="admin-note">
          Past events and unavailable posts are automatically replaced with
          current content.
        </p>
      </SavedForm>
    </AdminShell>
  );
}
