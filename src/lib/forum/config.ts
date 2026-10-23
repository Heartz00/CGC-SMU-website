import "server-only";
export function forumConfig() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || "";
  try {
    const parsed = new URL(url);
    if (
      (parsed.protocol !== "https:" &&
        !(
          process.env.NODE_ENV !== "production" &&
          parsed.protocol === "http:" &&
          ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname)
        )) ||
      parsed.username ||
      parsed.password ||
      !key
    )
      return null;
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}
export function forumEnabled() {
  return (
    process.env.FORUM_ENABLED === "true" &&
    !!forumConfig() &&
    !!process.env.SUPABASE_SECRET_KEY
  );
}
