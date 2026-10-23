import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { forumConfig, forumEnabled } from "@/lib/forum/config";
export async function proxy(request: NextRequest) {
  const config = forumConfig();
  let response = NextResponse.next({ request });
  if (!config || !forumEnabled()) return response;
  const client = createServerClient(config.url, config.key, {
    cookieOptions: {
      name: "cgc-forum-auth",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items, headers) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        if (headers)
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
      },
    },
  });
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/forum/:path*", "/api/forum/:path*"] };
