import Link from "next/link";
import { AdminShell } from "@/components/admin/shared";
import { requireAdmin } from "@/lib/admin/auth";
import { resources } from "@/lib/resources";
export default async function Resources() {
  await requireAdmin("publish_pages");
  return (
    <AdminShell
      title="Support for the road ahead."
      description="Keep the council’s resource pages up to date."
    >
      <div className="admin-cards">
        {resources.map((resource) => (
          <Link
            className="admin-card"
            key={resource.slug}
            href={`/admin/resources/${resource.slug}`}
          >
            <h2>{resource.title}</h2>
            <p>{resource.description}</p>
            <span className="text-link">Edit resource ↗</span>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
