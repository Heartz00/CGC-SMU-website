"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { forumClient } from "@/lib/forum/server";
import {
  ForumError,
  studentEmail,
  safeForumNext,
  forumPassword,
} from "@/lib/forum/validation";
import { forumConfig } from "@/lib/forum/config";
import { passwordForumAuth } from "@/lib/forum/password-auth";
import type { ForumResult } from "@/lib/forum/types";
async function checkOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin || new URL(origin).host !== h.get("host"))
    throw new ForumError("Refresh this page before signing in.");
}
export async function authenticateForum(
  _previous: ForumResult,
  form: FormData,
): Promise<ForumResult> {
  try {
    await checkOrigin();
    const email = studentEmail(form.get("email"));
    const creating = form.get("mode") === "signup";
    const password = forumPassword(form.get("password"), creating);
    if (creating && password !== form.get("passwordConfirmation"))
      throw new ForumError("The passwords do not match.");
    const client = await forumClient();
    let signupReady = false;
    if (creating) {
      // Avoid triggering any confirmation email when project settings are not ready.
      const config = forumConfig()!;
      const response = await fetch(config.url + "/auth/v1/settings", {
        headers: { apikey: config.key },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const settings = await response.json();
        signupReady =
          settings.mailer_autoconfirm === true &&
          settings.disable_signup !== true &&
          settings.external?.email === true;
      }
    }
    await passwordForumAuth(client, { email, password }, creating, signupReady);
    return {
      success: true,
      message: creating ? "Account created." : "Signed in.",
      next: safeForumNext(form.get("next")),
    };
  } catch (error) {
    return {
      message:
        error instanceof ForumError
          ? error.message
          : "Sign-in is temporarily unavailable. Please try again.",
    };
  }
}
export async function signOutForum() {
  await checkOrigin();
  try {
    const client = await forumClient();
    await client.auth.signOut({ scope: "local" });
  } catch {
    // Local sign-out must still work while the service is unavailable.
  }
  const jar = await cookies();
  for (const cookie of jar.getAll()) {
    if (
      cookie.name === "cgc-forum-auth" ||
      cookie.name.startsWith("cgc-forum-auth.")
    )
      jar.delete(cookie.name);
  }
  redirect("/forum/login");
}
