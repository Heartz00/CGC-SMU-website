import { forumApi, forumBody } from "@/lib/forum/http";
import { forumRpc } from "@/lib/forum/server";
import { ForumError, forumId, forumText } from "@/lib/forum/validation";
export async function POST(request: Request) {
  return forumApi(true, request, async ({ client }) => {
    const data = await forumBody(request);
    if (typeof data.anonymous !== "boolean")
      throw new ForumError("Choose a posting identity.");
    return forumRpc(client, "cgc_forum_create_reply", {
      p_topic: forumId(data.topicId),
      p_body: forumText(data.body, "Message", 2, 8000),
      p_anonymous: data.anonymous,
      p_request: forumId(data.requestId),
    });
  });
}
