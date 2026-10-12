import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/shared";
import { SavedForm } from "@/components/admin/saved-form";
import { SubmitButton } from "@/components/admin/submit";
import { requireAdmin } from "@/lib/admin/auth";
import { wordpressRequest, type EditablePost } from "@/lib/admin/wordpress";
import type { Revision } from "@/lib/admin/revisions";
import { cleanHtml } from "@/lib/content/adapters";
import { restoreRevision } from "../../../actions";
export default async function Versions({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  if (!["pages", "posts"].includes(kind) || !/^\d+$/.test(id)) notFound();
  const { session } = await requireAdmin(
    kind === "pages" ? "edit_pages" : "edit_posts",
  );
  const current = await wordpressRequest<EditablePost>(
    session,
    `${kind}/${id}`,
    { query: { context: "edit" } },
  );
  let revisions: Revision[] = [],
    unavailable = false;
  try {
    revisions = await wordpressRequest<Revision[]>(
      session,
      `${kind}/${id}/revisions`,
      { query: { context: "edit", per_page: "50" } },
    );
  } catch {
    unavailable = true;
  }
  const authors = new Map<number, string>();
  await Promise.all(
    [...new Set(revisions.map((r) => r.author))].map(async (author) => {
      try {
        const u = await wordpressRequest<{ name: string }>(
          session,
          `users/${author}`,
        );
        authors.set(author, u.name);
      } catch {
        authors.set(author, `Editor ${author}`);
      }
    }),
  );
  return (
    <AdminShell
      title="Saved versions."
      description={current.title.raw || current.title.rendered}
    >
      <details>
        <summary>Current content</summary>
        <div
          className="prose"
          dangerouslySetInnerHTML={{
            __html: cleanHtml(current.content.rendered),
          }}
        />
      </details>
      {revisions.map((revision) => (
        <details key={revision.id} className="admin-record-group">
          <summary>
            {revision.date_gmt.replace("T", " ")} UTC ·{" "}
            {authors.get(revision.author)}
          </summary>
          <div className="admin-editor">
            <h2>{revision.title.rendered}</h2>
            <div
              className="prose"
              dangerouslySetInnerHTML={{
                __html: cleanHtml(revision.content.rendered),
              }}
            />
            <SavedForm action={restoreRevision}>
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="revision" value={revision.id} />
              <input
                type="hidden"
                name="version"
                value={current.modified_gmt}
              />
              <label className="admin-check">
                <input type="checkbox" name="confirm" required />
                <span>
                  Replace current title and content with this version.
                </span>
              </label>
              <SubmitButton label="Restore this version" />
            </SavedForm>
          </div>
        </details>
      ))}
      {!revisions.length && (
        <p>
          {unavailable
            ? "Saved versions could not be loaded. Try again or ask the site administrator."
            : "No saved revisions are available for this record."}
        </p>
      )}
    </AdminShell>
  );
}
