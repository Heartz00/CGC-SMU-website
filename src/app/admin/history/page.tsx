import Link from "next/link";
import { AdminShell } from "@/components/admin/shared";
import { requireAdmin } from "@/lib/admin/auth";
import { wordpressRequest, type EditablePost } from "@/lib/admin/wordpress";
export default async function History() {
  const { session, user } = await requireAdmin();
  const records = await Promise.all(
    (["pages", "posts"] as const).map(async (kind) => {
      if (!user.capabilities[kind === "pages" ? "edit_pages" : "edit_posts"])
        return [];
      const pages = await wordpressRequest<EditablePost[]>(session, kind, {
        query: {
          context: "edit",
          status: "publish,draft,future,pending,private",
          per_page: "30",
          orderby: "modified",
          order: "desc",
        },
      });
      return pages.map((p) => ({ kind, p }));
    }),
  );
  return (
    <AdminShell
      title="Changes you can trace."
      description="Review saved versions and recover earlier content."
    >
      <div className="admin-list">
        {records
          .flat()
          .sort((a, b) => b.p.modified_gmt.localeCompare(a.p.modified_gmt))
          .map(({ kind, p }) => (
            <Link
              key={`${kind}-${p.id}`}
              href={`/admin/history/${kind}/${p.id}`}
            >
              <strong>{p.title.raw || p.title.rendered}</strong>
              <span>
                {kind === "posts" ? "Announcement" : "Page"} · {p.status}
              </span>
              <time>{p.modified_gmt.replace("T", " ")} UTC</time>
            </Link>
          ))}
      </div>
      <p className="admin-note">
        Latest 30 records per type. Revision availability follows the
        site&apos;s retention settings.
      </p>
    </AdminShell>
  );
}
