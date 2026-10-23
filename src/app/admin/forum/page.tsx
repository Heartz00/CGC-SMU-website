import Link from "next/link";
import { AdminShell } from "@/components/admin/shared";
import { requireAdmin } from "@/lib/admin/auth";
import { forumEnabled } from "@/lib/forum/config";
import { moderationClient, forumRpc } from "@/lib/forum/server";
import { ForumModerationForm } from "@/components/forum/moderation-form";
import { forumDate, type ForumReport } from "@/lib/forum/types";
export default async function ForumModeration({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin("moderate_comments");
  const status =
    (await searchParams).status === "resolved" ? "resolved" : "open";
  let reports: ForumReport[] = [];
  let error = "";
  if (forumEnabled()) {
    try {
      reports = await forumRpc<ForumReport[]>(
        moderationClient(),
        "cgc_forum_moderation_queue",
        { p_status: status },
      );
    } catch {
      error =
        "The moderation queue could not be loaded. Check the forum configuration and try again.";
    }
  }
  return (
    <AdminShell
      title="Keep the conversation constructive."
      description="Review community reports and manage discussion access."
    >
      {!forumEnabled() ? (
        <p className="admin-notice">
          Complete the forum setup before reviewing reports.
        </p>
      ) : (
        <>
          <p className="admin-note">
            Moderator-only information includes account identities for
            investigating anonymous posts. Keep this information private.
            Actions are recorded in the moderation audit trail.
          </p>
          <p>
            <Link
              className="text-link"
              href={
                status === "open"
                  ? "/admin/forum?status=resolved"
                  : "/admin/forum"
              }
            >
              {status === "open"
                ? "View resolved reports"
                : "View open reports"}
            </Link>
          </p>
          {error && (
            <p className="admin-notice" role="alert">
              {error}
            </p>
          )}
          <h2>{status === "open" ? "Open reports" : "Resolved reports"}</h2>
          {!reports.length && !error && (
            <p>No {status} reports. Showing up to 100 reports at a time.</p>
          )}
          <div className="admin-forum-reports">
            {reports.map((report) => (
              <article className="admin-record" key={report.id}>
                <h3>{report.title}</h3>
                <p>
                  <strong>Reported:</strong> {forumDate(report.created_at)} ·{" "}
                  {report.kind}
                </p>
                <p>
                  <strong>Reason:</strong> {report.reason}
                </p>
                <blockquote
                  style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                >
                  {report.body}
                </blockquote>
                <details className="admin-more-options">
                  <summary>Moderator-only account details</summary>
                  <p>
                    <strong>Reported by:</strong> {report.reporter_email}
                  </p>
                  <p>
                    <strong>Post author:</strong> {report.author_email}
                  </p>
                  <p>
                    {report.hidden ? "Post hidden" : "Post visible"} ·{" "}
                    {report.banned ? "Author suspended" : "Author active"}
                  </p>
                  <ForumModerationForm
                    memberId={report.author_id}
                    banned={report.banned}
                  />
                </details>
                <Link
                  className="text-link"
                  href={`/forum/${report.topic_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View discussion ↗
                </Link>
                <ForumModerationForm reportId={report.id} />
              </article>
            ))}
          </div>
          <details className="admin-more-options">
            <summary>Pin, close, or hide another discussion</summary>
            <ForumModerationForm />
          </details>
        </>
      )}
    </AdminShell>
  );
}
