import { AdminShell, Notice } from "@/components/admin/shared";
import { SubmitButton } from "@/components/admin/submit";
import { requireAdmin } from "@/lib/admin/auth";
import { wordpressRequest, type WordPressUser } from "@/lib/admin/wordpress";
import { grantEditor } from "../actions";
import { site } from "@/lib/site";
export default async function Access({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { session, user } = await requireAdmin();
  const { notice } = await searchParams;
  let members: WordPressUser[] = [];
  let restricted = false;
  if (user.capabilities.list_users)
    try {
      members = await wordpressRequest(session, "users", {
        query: { context: "edit", per_page: "100" },
      });
    } catch {
      restricted = true;
    }
  return (
    <AdminShell
      title="Share the responsibility."
      description="Manage who can edit the website."
    >
      <Notice kind={notice} />
      <div className="admin-note">
        <h2>Invite a member.</h2>
        <p>Invite a member as an Editor to let them update content.</p>
        <a className="button" href={`${site.wordpress}/wp-admin/user-new.php`}>
          Add a Council archive
        </a>
      </div>
      {(!user.capabilities.list_users || restricted) && (
        <p className="admin-notice">
          You cannot view members. Ask an administrator for access.
        </p>
      )}
      <div className="admin-list">
        {members.map((member) => (
          <div key={member.id}>
            <strong>{member.name}</strong>
            <span>{member.roles.join(", ")}</span>
            {user.capabilities.promote_users &&
              member.id !== user.id &&
              !member.roles.includes("administrator") &&
              !member.roles.includes("editor") && (
                <form action={grantEditor}>
                  <input name="userId" type="hidden" value={member.id} />
                  <SubmitButton
                    label="Give Editor access"
                    pending="Updating access…"
                    secondary
                  />
                </form>
              )}
          </div>
        ))}
      </div>
      <div className="admin-note">
        <h2>Remove access during handover.</h2>
        <p>Remove membership or editing access when an officer leaves.</p>
        <a className="text-link" href={`${site.wordpress}/wp-admin/users.php`}>
          Manage members and removal ↗
        </a>
      </div>
    </AdminShell>
  );
}
