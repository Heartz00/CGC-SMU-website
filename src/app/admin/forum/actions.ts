"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { forumRpc, moderationClient } from "@/lib/forum/server";
import { ForumError, forumId, forumText } from "@/lib/forum/validation";
import type { SaveResult } from "@/lib/admin/save-result";
export async function moderateForum(form: FormData): Promise<SaveResult> {
  const { user } = await requireAdmin("moderate_comments");
  try {
    const h = await headers();
    if (!h.get("origin") || new URL(h.get("origin")!).host !== h.get("host"))
      throw new ForumError("Refresh the page before moderating.");
    const client = moderationClient();
    const action = forumText(form.get("moderationAction"), "Action", 3, 20);
    const actor = `wordpress:${user.id}`;
    const report = form.get("reportId");
    if (report) {
      if (!["hide", "restore", "resolve", "suspend"].includes(action))
        throw new ForumError("Choose a report action.");
      await forumRpc(client, "cgc_forum_handle_report", {
        p_report: forumId(report),
        p_action: action,
        p_actor: actor,
      });
    } else if (form.get("memberId")) {
      if (!["suspend", "reinstate"].includes(action))
        throw new ForumError("Choose an account action.");
      await forumRpc(client, "cgc_forum_suspend", {
        p_member: forumId(form.get("memberId")),
        p_suspended: action === "suspend",
        p_actor: actor,
      });
    } else {
      if (
        !["pin", "unpin", "lock", "unlock", "hide", "restore"].includes(action)
      )
        throw new ForumError("Choose a discussion action.");
      let id = forumText(form.get("topic"), "Discussion link or ID", 10, 500);
      if (id.includes("/")) {
        try {
          id =
            new URL(id, "https://forum.invalid").pathname
              .split("/")
              .filter(Boolean)
              .at(-1) || "";
        } catch {
          throw new ForumError("Enter a discussion link or ID.");
        }
      }
      await forumRpc(client, "cgc_forum_moderate", {
        p_kind: "topic",
        p_id: forumId(id),
        p_action: action,
        p_actor: actor,
      });
    }
    revalidatePath("/admin/forum");
    return { success: true, message: "Moderation saved." };
  } catch (error) {
    return {
      message:
        error instanceof ForumError
          ? error.message
          : "Moderation could not be saved. Please try again.",
    };
  }
}
