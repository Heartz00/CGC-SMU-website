import { forumApi, forumBody } from "@/lib/forum/http";
import { forumRpc } from "@/lib/forum/server";
import {
  ForumError,
  forumId,
  forumText,
  pageNumber,
} from "@/lib/forum/validation";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  return forumApi(false, request, async ({ client }) => {
    const data = await forumRpc(client, "cgc_forum_discussion", {
      p_id: forumId((await params).id),
      p_page: pageNumber(new URL(request.url).searchParams.get("page")),
    });
    if (!data)
      throw new ForumError("This discussion is no longer available.", 404);
    return data;
  });
}
export async function PATCH(request: Request, { params }: Context) {
  return forumApi(true, request, async ({ client }) => {
    const body = await forumBody(request);
    if (typeof body.anonymous !== "boolean")
      throw new ForumError("Choose a posting identity.");
    await forumRpc(client, "cgc_forum_edit", {
      p_kind: "topic",
      p_id: forumId((await params).id),
      p_title: forumText(body.title, "Title", 4, 160),
      p_body: forumText(body.body, "Message", 2, 8000),
      p_anonymous: body.anonymous,
      p_version: forumText(body.version, "Version", 10, 50),
    });
    return { success: true };
  });
}
export async function DELETE(request: Request, { params }: Context) {
  return forumApi(true, request, async ({ client }) => {
    await forumRpc(client, "cgc_forum_delete", {
      p_kind: "topic",
      p_id: forumId((await params).id),
    });
    return { success: true };
  });
}
