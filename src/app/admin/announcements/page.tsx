import Link from "next/link";
import { AdminShell, Notice } from "@/components/admin/shared";
import { requireAdmin } from "@/lib/admin/auth";
import { wordpressRequest, type EditablePost } from "@/lib/admin/wordpress";
import { isCombinedUpdate } from "@/lib/admin/publishing";
export default async function Announcements({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { session } = await requireAdmin("edit_posts");
  const { notice } = await searchParams;
  const posts = await wordpressRequest<EditablePost[]>(session, "posts", {
    query: { context: "edit", status: "publish,draft,pending", per_page: "30" },
  });
  return (
    <AdminShell
      title="Keep the community informed."
      description="Write announcements, keep drafts private, and publish when you’re ready."
    >
      <Notice kind={notice} />
      <Link className="button" href="/admin/publish">
        + New announcement
      </Link>
      <p className="admin-note">
        <Link href="/admin/publish?template=ncw">
          Start with the ACS National Chemistry Week example →
        </Link>
      </p>
      <div className="admin-list">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={
              isCombinedUpdate(post.content.raw || post.content.rendered)
                ? `/admin/publish?post=${post.id}`
                : `/admin/announcements/${post.id}`
            }
          >
            <strong>{post.title.raw || post.title.rendered}</strong>
            <span className="admin-badge">{post.status}</span>
            <span> Edit ↗</span>
          </Link>
        ))}
      </div>
      <p className="section-note">
        Showing the latest 30 announcements, including drafts your account can
        access.
      </p>
    </AdminShell>
  );
}
