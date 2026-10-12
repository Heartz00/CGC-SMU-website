import { notFound } from "next/navigation";
import { AdminShell, Notice } from "@/components/admin/shared";
import { PublishForm } from "@/components/admin/publish-form";
import { requireAdmin } from "@/lib/admin/auth";
import { wordpressRequest, type EditablePost } from "@/lib/admin/wordpress";
import { eventDraft, isCombinedUpdate } from "@/lib/admin/publishing";
import { announcementParts } from "@/lib/content/flyer";
import { editableText } from "@/lib/admin/content";
import { ncwTemplate } from "@/lib/admin/event-template";
import type { CouncilEvent } from "@/lib/content/types";
export default async function Publish({
  searchParams,
}: {
  searchParams: Promise<{ post?: string; template?: string; saved?: string }>;
}) {
  const { session, user } = await requireAdmin("edit_posts");
  const query = await searchParams;
  if (query.post && !/^\d+$/.test(query.post)) notFound();
  const post = query.post
    ? await wordpressRequest<EditablePost>(session, `posts/${query.post}`, {
        query: { context: "edit" },
      })
    : null;
  const html = post?.content.raw || post?.content.rendered || "";
  if (post && !isCombinedUpdate(html)) notFound();
  const parts = announcementParts(html);
  const event: CouncilEvent | undefined =
    eventDraft(html) ||
    (!post && query.template === "ncw" ? ncwTemplate : undefined);
  return (
    <AdminShell
      title="Share something new."
      description="Publish an announcement and event together."
    >
      <Notice kind={query.saved === "1" ? "saved" : undefined} />
      <PublishForm
        initial={{
          title: post?.title.raw || post?.title.rendered || event?.title || "",
          body: event?.description || editableText(parts.body),
          flyer: parts.flyer || event?.flyer || "",
          registration: parts.registration || event?.registration || "",
          event,
          postId: post?.id,
          version: post?.modified_gmt,
          status: post?.status,
          publishAt:
            post?.status === "future" && post.date_gmt
              ? `${post.date_gmt}Z`
              : undefined,
        }}
        canPublish={!!user.capabilities.publish_posts}
        canCalendar={!!user.capabilities.publish_pages}
        draftKey={`cgc-draft:${user.id}:update:${post?.id || "new"}:${query.template || "blank"}`}
      />
    </AdminShell>
  );
}
