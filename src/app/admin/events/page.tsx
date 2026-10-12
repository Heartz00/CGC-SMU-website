import { AdminShell, Notice } from "@/components/admin/shared";
import { RecordsEditor } from "@/components/admin/records";
import { requireAdmin } from "@/lib/admin/auth";
import { editablePage } from "@/lib/admin/wordpress";
import { parseEvents } from "@/lib/content/adapters";
import { saveEvents } from "../actions";
import { site } from "@/lib/site";
import Link from "next/link";
export default async function Events({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { session } = await requireAdmin("publish_pages");
  const { notice } = await searchParams;
  const page = await editablePage(
    session,
    process.env.WORDPRESS_EVENTS_SLUG || "events",
  );
  return (
    <AdminShell
      title="Make time for community."
      description="Add and update upcoming events."
    >
      <Notice kind={notice} />
      <p>
        <Link className="button" href="/admin/publish">
          Create event & announcement
        </Link>
      </p>
      <p>
        <a
          className="text-link"
          href={`${site.wordpress}/wp-admin/edit.php?post_type=calendar_event`}
        >
          Manage calendar entries ?
        </a>
      </p>
      <RecordsEditor
        kind="events"
        initial={page ? parseEvents(page.content.rendered) : []}
        version={page?.modified_gmt || "new"}
        action={saveEvents}
      />
    </AdminShell>
  );
}
