import { SavedForm } from "@/components/admin/saved-form";
import { notFound } from "next/navigation";
import {
  AdminShell,
  Notice,
  ReplacementWarning,
  TextArea,
} from "@/components/admin/shared";
import { SubmitButton } from "@/components/admin/submit";
import { requireAdmin } from "@/lib/admin/auth";
import { editablePage } from "@/lib/admin/wordpress";
import { editableText } from "@/lib/admin/content";
import { resources } from "@/lib/resources";
import { saveResource } from "../../actions";
export default async function Resource({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { session, user } = await requireAdmin("publish_pages");
  const { slug } = await params;
  const { notice } = await searchParams;
  const resource = resources.find((item) => item.slug === slug);
  if (!resource) notFound();
  const page = await editablePage(session, resource.wordpressSlug);
  return (
    <AdminShell title={resource.title} description="Update this resource.">
      <Notice kind={notice} />
      {page ? (
        <SavedForm
          action={saveResource}
          className="admin-editor"
          draftKey={`cgc-draft:${user.id}:resource:${slug}`}
        >
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="version" value={page.modified_gmt} />
          <TextArea
            label="Resource content"
            name="body"
            value={editableText(page.content.raw || page.content.rendered)}
            rows={18}
          />
          <ReplacementWarning />
          <div className="admin-form-actions">
            <SubmitButton />
            <a className="text-link" href={`${page.link.replace(/\/$/, "")}/`}>
              View resource ↗
            </a>
          </div>
        </SavedForm>
      ) : (
        <p className="admin-notice">This resource is unavailable.</p>
      )}
    </AdminShell>
  );
}
