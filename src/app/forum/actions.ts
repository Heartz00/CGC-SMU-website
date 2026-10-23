"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { forumClient } from "@/lib/forum/server";
import {
  ForumError,
  studentEmail,
  safeForumNext,
  forumText,
} from "@/lib/forum/validation";
import type { ForumResult } from "@/lib/forum/types";
async function checkOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin || new URL(origin).host !== h.get("host"))
    throw new ForumError("Refresh this page before signing in.");
}
export async function requestForumCode(
  _previous: ForumResult,
  form: FormData,
): Promise<ForumResult> {
  try {
    await checkOrigin();
    const email = studentEmail(form.get("email"));
    const client = await forumClient();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error)
      return {
        message:
          error.status === 429
            ? "Please wait before requesting another code."
            : "We could not send a code. Please try again or contact the council.",
      };
    return {
      success: true,
      phase: "verify",
      email,
      message: "Check your SMU inbox for your sign-in code.",
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
export async function verifyForumCode(
  _previous: ForumResult,
  form: FormData,
): Promise<ForumResult> {
  try {
    await checkOrigin();
    const email = studentEmail(form.get("email"));
    const code = forumText(form.get("code"), "Code", 6, 10);
    if (!/^\d{6,10}$/.test(code))
      throw new ForumError("Enter the code from your SMU email.");
    const client = await forumClient();
    const { data, error } = await client.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error || !data.user?.email_confirmed_at)
      return {
        message:
          "That code is invalid or has expired. Request a new code and try again.",
      };
    if (studentEmail(data.user.email) !== email) {
      await client.auth.signOut({ scope: "local" });
      throw new ForumError("Use your verified SMU account.");
    }
    return {
      success: true,
      message: "Signed in.",
      next: safeForumNext(form.get("next")),
    };
  } catch (error) {
    return {
      message:
        error instanceof ForumError
          ? error.message
          : "We could not verify your code. Please try again.",
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
