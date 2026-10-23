import { forumApi, forumBody } from "@/lib/forum/http";
import { forumRpc } from "@/lib/forum/server";
import { ForumError, forumId, forumText } from "@/lib/forum/validation";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  return forumApi(true, request, async ({ client }) => {
    const data = await forumBody(request);
    if (typeof data.anonymous !== "boolean")
      throw new ForumError("Choose a posting identity.");
    await forumRpc(client, "cgc_forum_edit", {
      p_kind: "reply",
      p_id: forumId((await params).id),
      p_body: forumText(data.body, "Message", 2, 8000),
      p_anonymous: data.anonymous,
      p_version: forumText(data.version, "Version", 10, 50),
    });
    return { success: true };
  });
}
export async function DELETE(request: Request, { params }: Context) {
  return forumApi(true, request, async ({ client }) => {
    await forumRpc(client, "cgc_forum_delete", {
      p_kind: "reply",
      p_id: forumId((await params).id),
    });
    return { success: true };
  });
}
