import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { forumConfig, forumEnabled } from "./config";
import { ForumError } from "./validation";
import type { ForumProfile } from "./types";
export async function forumClient() {
  const config = forumConfig();
  if (!config || !forumEnabled())
    throw new ForumError("The community forum is not open yet.", 503);
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: {
      name: "cgc-forum-auth",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* The forum proxy refreshes cookies before server rendering. */
        }
      },
    },
  });
}
export const forumSession = cache(async () => {
  if (!forumEnabled()) return null;
  const client = await forumClient();
  const { data, error } = await client.auth.getUser();
  if (
    error ||
    !data.user?.email_confirmed_at ||
    !/^[^@]+@smu\.edu$/i.test(data.user.email || "")
  )
    return null;
  return { client, user: data.user };
});
export async function requireForum(next = "/forum") {
  const session = await forumSession();
  if (!session) redirect(`/forum/login?next=${encodeURIComponent(next)}`);
  return session;
}
export async function forumRpc<T>(
  client: Awaited<ReturnType<typeof forumClient>>,
  name: string,
  args: Record<string, unknown> = {},
) {
  const { data, error } = await client.rpc(name, args);
  if (error) {
    const allowed =
      /^(Choose |Enter |Your |This |Please |Only |A verified |Discussion |Message |Display name |You |Wait |Sign in |Post )/.test(
        error.message,
      );
    throw new ForumError(
      error.code === "P0001" && allowed
        ? error.message
        : "The forum could not complete this request. Please try again.",
      error.code === "P0001"
        ? /^(Your forum access|A verified|You cannot)/.test(error.message)
          ? 403
          : /^Sign in/.test(error.message)
            ? 401
            : 400
        : 503,
    );
  }
  return data as T;
}
export async function forumProfile(
  client: Awaited<ReturnType<typeof forumClient>>,
) {
  return forumRpc<ForumProfile>(client, "cgc_forum_profile");
}
export function moderationClient() {
  const config = forumConfig();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!config || !key || !forumEnabled())
    throw new ForumError("Forum moderation is not configured.", 503);
  return createClient(config.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
