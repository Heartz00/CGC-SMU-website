import { SavedForm } from "@/components/admin/saved-form";
import { notFound } from "next/navigation";
import {
  AdminShell,
  Field,
  Notice,
  ReplacementWarning,
  TextArea,
} from "@/components/admin/shared";
import { SubmitButton } from "@/components/admin/submit";
import { requireAdmin } from "@/lib/admin/auth";
import { wordpressRequest, type EditablePost } from "@/lib/admin/wordpress";
import { editableText, needsFormattingConfirmation } from "@/lib/admin/content";
import { saveAnnouncement } from "../../actions";
import { ImagePicker } from "@/components/admin/image-picker";
import { announcementParts } from "@/lib/content/flyer";
import { ncwTemplate } from "@/lib/admin/event-template";
import { RecordPreview } from "@/components/admin/record-preview";
import { PublishingSchedule } from "@/components/admin/publishing-schedule";
export default async function Announcement({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; template?: string }>;
}) {
  const { session, user } = await requireAdmin("edit_posts");
  const { id } = await params;
  const { notice, template } = await searchParams;
  if (id !== "new" && !/^\d+$/.test(id)) notFound();
  const post =
    id === "new"
      ? null
      : await wordpressRequest<EditablePost>(session, `posts/${id}`, {
          query: { context: "edit" },
        });
  const parts = announcementParts(
    post?.content.raw || post?.content.rendered || "",
  );
  const example = !post && template === "ncw" ? ncwTemplate : null;
  return (
    <AdminShell
      title={post ? "Edit announcement." : "Share an update."}
      description="Write clear, simple text. Separate paragraphs with a blank line."
    >
      <Notice kind={notice} />
      <SavedForm action={saveAnnouncement} className="admin-editor">
        <input type="hidden" name="id" value={post?.id || ""} />
        <input
          type="hidden"
          name="version"
          value={post?.modified_gmt || "new"}
        />
        <Field
          name="title"
          label="Title"
          value={post?.title.raw || post?.title.rendered || example?.title}
          required
          maxLength={200}
        />
        <TextArea
          name="body"
          label="Announcement"
          value={post ? editableText(parts.body) : example?.description || ""}
          required
          rows={14}
          help="Include the date, Dallas time, location, and what visitors should expect. These details remain readable without the flyer."
        />
        <div className="admin-field">
          <span>Flyer (optional)</span>
          <ImagePicker initial={parts.flyer || ""} name="flyer" />
        </div>
        <Field
          name="registration"
          label="Registration or Instagram link (optional)"
          type="url"
          value={parts.registration || ""}
          maxLength={1000}
          help="Paste the registration link behind the QR code, so visitors can click it directly."
        />
        {example && (
          <p className="admin-note">
            The ACS example is a draft. Upload your flyer and add the
            registration URL before publishing. To also appear under Upcoming
            Events, add this activity in Events.
          </p>
        )}
        {post && needsFormattingConfirmation(parts.body) && (
          <ReplacementWarning />
        )}
        <label className="admin-field">
          <span>Publishing</span>
          <select
            name="status"
            defaultValue={
              post?.status === "future"
                ? "future"
                : post?.status === "publish"
                  ? "publish"
                  : "draft"
            }
          >
            <option value="draft">Save as draft</option>
            {user.capabilities.publish_posts && (
              <option value="publish">Publish publicly</option>
            )}
            {user.capabilities.publish_posts && (
              <option value="future">Schedule publication</option>
            )}
          </select>
        </label>
        <PublishingSchedule
          initial={
            post?.status === "future" && post.date_gmt
              ? `${post.date_gmt}Z`
              : ""
          }
        />
        <SubmitButton />
        <RecordPreview kind="announcement" />
      </SavedForm>
    </AdminShell>
  );
}
