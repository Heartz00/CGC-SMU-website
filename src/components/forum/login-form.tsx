"use client";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { authenticateForum } from "@/app/forum/actions";
import type { ForumResult } from "@/lib/forum/types";
function LoginSubmit({ creating }: { creating: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="forum-primary" disabled={pending}>
      {pending ? "Please wait…" : creating ? "Create account" : "Sign in"}
    </button>
  );
}
function AccountForm({ creating, next }: { creating: boolean; next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [result, action] = useActionState(authenticateForum, {
    message: "",
  } as ForumResult);
  useEffect(() => {
    if (result.success && result.next) {
      router.replace(result.next);
      router.refresh();
    }
  }, [result, router]);
  return (
    <form action={action} className="forum-form">
      <input type="hidden" name="mode" value={creating ? "signup" : "signin"} />
      <input type="hidden" name="next" value={next} />
      <label>
        SMU email
        <input
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          placeholder="you@smu.edu"
        />
      </label>
      <label>
        {creating ? "Create a forum password" : "Forum password"}
        <input
          name="password"
          type="password"
          autoComplete={creating ? "new-password" : "current-password"}
          required
          minLength={creating ? 10 : 1}
          maxLength={128}
        />
      </label>
      {creating && (
        <label>
          Confirm password
          <input
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={128}
          />
        </label>
      )}
      <p className="forum-help">
        {creating
          ? "Use at least 10 characters. Choose a new password for this forum; do not use your SMU password."
          : "Use the password you created for this forum, not your SMU account password."}
      </p>
      <LoginSubmit creating={creating} />
      {result.message && (
        <p role={result.success ? "status" : "alert"}>{result.message}</p>
      )}
    </form>
  );
}
export function ForumLoginForm({ next }: { next: string }) {
  const [creating, setCreating] = useState(false);
  return (
    <>
      <div
        className="forum-account-switch"
        role="group"
        aria-label="Account access"
      >
        <button
          type="button"
          className={creating ? "forum-secondary" : "forum-primary"}
          aria-pressed={!creating}
          onClick={() => setCreating(false)}
        >
          Sign in
        </button>
        <button
          type="button"
          className={creating ? "forum-primary" : "forum-secondary"}
          aria-pressed={creating}
          onClick={() => setCreating(true)}
        >
          Create account
        </button>
      </div>
      <AccountForm
        key={creating ? "signup" : "signin"}
        creating={creating}
        next={next}
      />
      <p className="forum-help">
        Email verification is currently disabled. An SMU email address does not
        establish verified membership.
      </p>
      <Link href="/contact">Need help accessing your account?</Link>
    </>
  );
}
