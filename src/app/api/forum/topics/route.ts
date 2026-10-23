import { forumApi, forumBody } from "@/lib/forum/http";
import { forumRpc } from "@/lib/forum/server";
import { forumId, pageNumber, topicInput } from "@/lib/forum/validation";
export async function GET(request: Request) {
  return forumApi(false, request, async ({ client }) => {
    const q = new URL(request.url).searchParams;
    return forumRpc(client, "cgc_forum_feed", {
      p_category: q.get("category") || "",
      p_search: (q.get("q") || "").slice(0, 120),
      p_sort: q.get("sort") === "newest" ? "newest" : "active",
      p_page: pageNumber(q.get("page")),
    });
  });
}
export async function POST(request: Request) {
  return forumApi(true, request, async ({ client }) => {
    const body = await forumBody(request);
    const data = topicInput(body);
    return {
      id: await forumRpc<string>(client, "cgc_forum_create_topic", {
        p_title: data.title,
        p_body: data.body,
        p_category: data.category,
        p_anonymous: data.anonymous,
        p_request: forumId(body.requestId),
      }),
    };
  });
}
