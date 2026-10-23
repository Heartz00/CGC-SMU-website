import { forumApi, forumBody } from "@/lib/forum/http";
import { forumRpc } from "@/lib/forum/server";
import { ForumError, forumId, forumText } from "@/lib/forum/validation";
export async function POST(request: Request) {
  return forumApi(true, request, async ({ client }) => {
    const data = await forumBody(request);
    if (data.kind !== "topic" && data.kind !== "reply")
      throw new ForumError("Choose a discussion or reply.");
    await forumRpc(client, "cgc_forum_report", {
      p_kind: data.kind,
      p_id: forumId(data.id),
      p_reason: forumText(data.reason, "Report reason", 5, 1000),
    });
    return { success: true };
  });
}
