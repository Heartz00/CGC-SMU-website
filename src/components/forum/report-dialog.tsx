"use client";
import { useState } from "react";
import { forumFetch } from "@/lib/forum/client";
import { ForumDialog } from "./primitives";
export function ForumReportDialog({
  kind,
  id,
  onClose,
}: {
  kind: "topic" | "reply";
  id: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <ForumDialog
      title={sent ? "Report received" : "Report a post"}
      onClose={onClose}
      busy={busy}
    >
      {sent ? (
        <>
          <p>Thank you. The council’s moderators will review this privately.</p>
          <button type="button" className="forum-primary" onClick={onClose}>
            Done
          </button>
        </>
      ) : (
        <form
          className="forum-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              await forumFetch("/api/forum/report", {
                method: "POST",
                body: JSON.stringify({ kind, id, reason }),
              });
              setSent(true);
            } catch (reason) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Could not send your report.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="forum-help">
            Reports are visible only to moderators. Explain what they should
            review.
          </p>
          <fieldset disabled={busy}>
            <label>
              Reason
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                minLength={5}
                maxLength={1000}
                rows={5}
                autoFocus
              />
            </label>
            <div className="forum-form-actions">
              <button
                type="button"
                className="forum-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button className="forum-primary">
                {busy ? "Sending…" : "Send report"}
              </button>
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="forum-error">
              {error}
            </p>
          )}
        </form>
      )}
    </ForumDialog>
  );
}
