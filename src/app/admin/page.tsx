import Link from "next/link";
import { AdminShell, Notice } from "@/components/admin/shared";
import { requireAdmin } from "@/lib/admin/auth";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { user } = await requireAdmin();
  const { notice } = await searchParams;
  const cards = [
    {
      href: "homepage",
      capability: "publish_pages",
      title: "Homepage",
      description: "Choose featured events and announcements.",
    },
    {
      href: "handover",
      capability: "publish_pages",
      title: "Council history",
      description: "Add past members and manage council terms.",
    },
    {
      href: "officers",
      capability: "publish_pages",
      title: "Your people",
      description: "Update names, roles, biographies, photos, and terms.",
    },
    {
      href: "events",
      capability: "publish_pages",
      title: "Your calendar",
      description: "Publish upcoming activities with dates and locations.",
    },
    {
      href: "announcements",
      capability: "edit_posts",
      title: "Your updates",
      description: "Write an announcement, save a draft, or publish.",
    },
    {
      href: "resources",
      capability: "publish_pages",
      title: "Student support",
      description: "Keep funding and everyday resources up to date.",
    },
    {
      href: "media",
      capability: "upload_files",
      title: "Photos",
      description: "Upload and choose photos and flyers.",
    },
    {
      href: "access",
      title: "People & access",
      description: "Manage members and editing access.",
    },
  ];
  return (
    <AdminShell
      title={`Welcome, ${user.name.split(" ")[0]}.`}
      description="Manage your website."
    >
      <Notice kind={notice} />
      <p>
        <Link className="button" href="/admin/publish">
          Create update
        </Link>
      </p>
      <div className="admin-cards">
        {cards.map((card) =>
          card.capability && !user.capabilities[card.capability] ? (
            <div className="admin-card" key={card.href}>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <p>Ask an administrator for editing access.</p>
            </div>
          ) : (
            <Link
              href={`/admin/${card.href}`}
              className="admin-card"
              key={card.href}
              prefetch={false}
            >
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <span className="text-link">Open workspace ↗</span>
            </Link>
          ),
        )}
      </div>
    </AdminShell>
  );
}
