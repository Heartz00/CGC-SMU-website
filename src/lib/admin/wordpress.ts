import "server-only";
import type { AdminSession } from "./session-codec";
import { AdminError } from "./errors";
export { AdminError } from "./errors";

export type WordPressUser = {
  id: number;
  name: string;
  username?: string;
  email?: string;
  roles: string[];
  capabilities: Record<string, boolean>;
};
export type EditablePost = {
  date_gmt?: string;
  id: number;
  slug: string;
  status: string;
  modified_gmt: string;
  link: string;
  title: { raw?: string; rendered: string };
  content: { raw?: string; rendered: string };
};
export function adminEndpoint(
  resource: string,
  query: Record<string, string> = {},
): URL {
  if (
    !/^(?:(?:users\/me|users|posts|pages|media)(?:\/\d+)?|(?:posts|pages)\/\d+\/revisions(?:\/\d+)?)$/.test(
      resource,
    )
  )
    throw new AdminError("validation", "Unsupported content endpoint.");
  const base =
    process.env.WORDPRESS_API_URL ||
    `${(process.env.WORDPRESS_URL || "https://blog.smu.edu/chemgrads").replace(/\/$/, "")}/wp-json/wp/v2/`;
  const url = new URL(base);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new AdminError(
      "validation",
      "A secure WordPress endpoint is required.",
    );
  if (url.searchParams.has("rest_route"))
    url.searchParams.set(
      "rest_route",
      `${url.searchParams.get("rest_route")!.replace(/\/$/, "")}/${resource}`,
    );
  else url.pathname = `${url.pathname.replace(/\/$/, "")}/${resource}`;
  Object.entries(query).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  return url;
}
export async function wordpressRequest<T>(
  credentials: Pick<AdminSession, "username" | "password">,
  resource: string,
  options: {
    method?: "GET" | "POST";
    query?: Record<string, string>;
    body?: unknown | FormData;
    onHeaders?: (headers: Headers) => void;
  } = {},
): Promise<T> {
  const multipart = options.body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(adminEndpoint(resource, options.query), {
      method: options.method || "GET",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64")}`,
        ...(options.body && !multipart
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: options.body
        ? multipart
          ? (options.body as FormData)
          : JSON.stringify(options.body)
        : undefined,
    });
  } catch {
    throw new AdminError(
      "connection",
      "WordPress could not be reached. Your changes were not saved.",
    );
  }
  if (!response.ok) {
    if (response.status === 401)
      throw new AdminError(
        "authentication",
        "WordPress did not accept this application password. Sign in again or check your WordPress profile.",
      );
    if (response.status === 403)
      throw new AdminError(
        "permission",
        "Your WordPress account does not have permission for this action.",
      );
    throw new AdminError(
      "connection",
      "WordPress did not accept the request. Your changes were not saved.",
    );
  }
  options.onHeaders?.(response.headers);
  return response.json() as Promise<T>;
}
export async function currentWordPressUser(
  credentials: Pick<AdminSession, "username" | "password">,
): Promise<WordPressUser> {
  const user = await wordpressRequest<WordPressUser>(credentials, "users/me", {
    query: { context: "edit" },
  });
  if (
    !Number.isSafeInteger(user.id) ||
    !Array.isArray(user.roles) ||
    !user.roles.length ||
    !user.capabilities ||
    !(user.capabilities.edit_posts || user.capabilities.edit_pages)
  )
    throw new AdminError(
      "permission",
      "An Editor or Administrator account on this WordPress site is required.",
    );
  return user;
}
export async function editablePage(session: AdminSession, slug: string) {
  const pages = await wordpressRequest<EditablePost[]>(session, "pages", {
    query: {
      slug,
      context: "edit",
      per_page: "1",
      status: "publish,draft,pending,private,future",
    },
  });
  return pages[0] || null;
}
export async function savePage(
  session: AdminSession,
  slug: string,
  title: string,
  content: string,
  expected: string,
) {
  const page = await editablePage(session, slug);
  if ((page?.modified_gmt || "new") !== expected)
    throw new AdminError(
      "conflict",
      "Someone else changed this page. Reload it before saving.",
    );
  return wordpressRequest<EditablePost>(
    session,
    page ? `pages/${page.id}` : "pages",
    { method: "POST", body: { title, slug, content, status: "publish" } },
  );
}
