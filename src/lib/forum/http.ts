import { NextResponse } from "next/server";
import { forumSession } from "./server";
import { ForumError } from "./validation";
export function forumJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
export async function forumApi(
  write: boolean,
  request: Request,
  action: (
    session: NonNullable<Awaited<ReturnType<typeof forumSession>>>,
  ) => Promise<unknown>,
) {
  try {
    const origin = request.headers.get("origin");
    let sameOrigin = false;
    try {
      const source = new URL(origin || "");
      sameOrigin =
        ["https:", "http:"].includes(source.protocol) &&
        source.host === request.headers.get("host");
    } catch {
      // Missing or malformed origins cannot authorize writes.
    }
    if (write && !sameOrigin)
      throw new ForumError(
        "This request could not be verified. Refresh and try again.",
        403,
      );
    const session = await forumSession();
    if (!session)
      throw new ForumError("Please sign in to the student forum.", 401);
    return forumJson(await action(session));
  } catch (error) {
    return forumJson(
      {
        error:
          error instanceof ForumError
            ? error.message
            : "The forum is temporarily unavailable. Your message has not been discarded.",
      },
      error instanceof ForumError ? error.status : 503,
    );
  }
}
export async function forumBody(
  request: Request,
): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ForumError("Send a valid forum message.");
  if (Number(request.headers.get("content-length")) > 64000)
    throw new ForumError("This message is too long.");
  const reader = request.body?.getReader();
  if (!reader) throw new ForumError("Send a forum message.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 64000) throw new ForumError("This message is too long.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value;
  } catch {
    throw new ForumError("Send a valid forum message.");
  }
}
