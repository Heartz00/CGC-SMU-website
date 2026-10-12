import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  openSession,
  sealSession,
  sessionKey,
  sessionLifetime,
  type AdminSession,
} from "./session-codec";
import { currentWordPressUser, type WordPressUser } from "./wordpress";
const cookieName =
  process.env.NODE_ENV === "production" ? "__Host-cgc-admin" : "cgc-admin";
export function adminConfigured() {
  try {
    sessionKey(process.env.ADMIN_SESSION_SECRET || "");
    return process.env.ADMIN_ENABLED === "true";
  } catch {
    return false;
  }
}
export async function createSession(
  username: string,
  password: string,
  userId: number,
) {
  const session: AdminSession = {
    username,
    password,
    userId,
    expires: Date.now() + sessionLifetime * 1000,
  };
  (await cookies()).set(
    cookieName,
    sealSession(session, process.env.ADMIN_SESSION_SECRET!),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: sessionLifetime,
    },
  );
}
export async function clearSession() {
  (await cookies()).delete(cookieName);
}
export const signedIn = cache(
  async (): Promise<{ session: AdminSession; user: WordPressUser } | null> => {
    if (!adminConfigured()) return null;
    const token = (await cookies()).get(cookieName)?.value;
    const session = token
      ? openSession(token, process.env.ADMIN_SESSION_SECRET!)
      : null;
    if (!session) return null;
    try {
      const user = await currentWordPressUser(session);
      return user.id === session.userId ? { session, user } : null;
    } catch {
      return null;
    }
  },
);
export async function requireAdmin(capability?: string) {
  const auth = await signedIn();
  if (!auth) redirect("/admin/login");
  if (capability && !auth.user.capabilities[capability])
    redirect("/admin?notice=permission");
  return auth;
}
