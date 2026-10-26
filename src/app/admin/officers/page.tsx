import { AdminShell, Notice } from "@/components/admin/shared";
import { RecordsEditor } from "@/components/admin/records";
import { requireAdmin } from "@/lib/admin/auth";
import { editablePage } from "@/lib/admin/wordpress";
import { getOfficers } from "@/lib/content";
import { parseOfficers } from "@/lib/content/adapters";
import { saveOfficers } from "../actions";
import Link from "next/link";
import { FacultyEditor } from "@/components/admin/faculty-editor";
import { facultySlug } from "@/lib/content/faculty";
export default async function Officers({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { session } = await requireAdmin("publish_pages");
  const { notice } = await searchParams;
  const page = await editablePage(
    session,
    process.env.WORDPRESS_MANAGED_OFFICERS_SLUG || "cgc-officers",
  );
  const current = page
    ? parseOfficers(page.content.rendered)
    : (await getOfficers()).items;
  const facultyPage = await editablePage(session, facultySlug);
  return (
    <AdminShell
      title="Meet the council."
      description="Update council members, photos, and biographies."
    >
      <Notice kind={notice} />
      <p>
        <Link className="text-link" href="/admin/handover">
          Term dates & council handover →
        </Link>
      </p>
      <p>
        <a
          className="text-link"
          href="/executive-committee"
          target="_blank"
          rel="noopener noreferrer"
        >
          View council page
        </a>
      </p>
      <RecordsEditor
        kind="officers"
        initial={current}
        version={page?.modified_gmt || "new"}
        action={saveOfficers}
      />
      <section
        aria-labelledby="faculty-editor-title"
        className="faculty-admin-section"
      >
        <h2 id="faculty-editor-title">Faculty leadership</h2>
        <FacultyEditor
          initial={
            facultyPage ? parseOfficers(facultyPage.content.rendered) : []
          }
          version={facultyPage?.modified_gmt || "new"}
        />
      </section>
    </AdminShell>
  );
}
