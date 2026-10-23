"use client";
import { SavedForm } from "@/components/admin/saved-form";
import { SubmitButton } from "@/components/admin/submit";
import { moderateForum } from "@/app/admin/forum/actions";
export function ForumModerationForm({
  reportId,
  memberId,
  banned = false,
}: {
  reportId?: string;
  memberId?: string;
  banned?: boolean;
}) {
  return (
    <SavedForm action={moderateForum} className="admin-editor">
      <input type="hidden" name="reportId" value={reportId || ""} />
      <input type="hidden" name="memberId" value={memberId || ""} />
      {!reportId && !memberId && (
        <label className="admin-field">
          <span>Discussion link or ID</span>
          <input
            name="topic"
            required
            maxLength={500}
            placeholder="Paste the discussion’s address"
          />
        </label>
      )}
      <label className="admin-field">
        <span>{memberId ? "Account access" : "Moderation action"}</span>
        <select
          name="moderationAction"
          defaultValue={
            memberId
              ? banned
                ? "reinstate"
                : "suspend"
              : reportId
                ? "resolve"
                : "pin"
          }
        >
          {reportId ? (
            <>
              <option value="resolve">Resolve report, keep the post</option>
              <option value="hide">Hide post & resolve report</option>
              <option value="restore">Restore post & resolve report</option>
              <option value="suspend">Suspend author & resolve report</option>
            </>
          ) : memberId ? (
            <>
              <option value="suspend">Suspend forum access</option>
              <option value="reinstate">Reinstate forum access</option>
            </>
          ) : (
            <>
              <option value="pin">Pin discussion</option>
              <option value="unpin">Unpin discussion</option>
              <option value="lock">Close replies</option>
              <option value="unlock">Reopen replies</option>
              <option value="hide">Hide discussion</option>
              <option value="restore">Restore hidden discussion</option>
            </>
          )}
        </select>
      </label>
      <label className="admin-check">
        <input type="checkbox" required />
        <span>
          I have reviewed this action and its effect on the community.
        </span>
      </label>
      <SubmitButton label="Apply moderation" cancel={false} />
    </SavedForm>
  );
}
