import { forumApi, forumBody } from "@/lib/forum/http";
import { forumRpc } from "@/lib/forum/server";
import { displayName } from "@/lib/forum/validation";
export async function PATCH(request: Request) {
  return forumApi(true, request, async ({ client }) => {
    const data = await forumBody(request);
    return forumRpc(client, "cgc_forum_set_profile", {
      p_name: displayName(data.displayName),
    });
  });
}
