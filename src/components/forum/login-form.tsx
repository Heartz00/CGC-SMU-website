"use client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { requestForumCode, verifyForumCode } from "@/app/forum/actions";
import type { ForumResult } from "@/lib/forum/types";
function LoginSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="forum-primary" disabled={pending}>
      {pending ? "Please wait…" : label}
    </button>
  );
}
export function ForumLoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [restart, setRestart] = useState(false);
  const [codeState, request] = useActionState(
    async (previous: ForumResult, data: FormData) => {
      const result = await requestForumCode(previous, data);
      if (result.phase === "verify") setRestart(false);
      return result;
    },
    { message: "" } as ForumResult,
  );
  const [verified, verify] = useActionState(verifyForumCode, {
    message: "",
  } as ForumResult);
  const checking = codeState.phase === "verify" && !restart;
  useEffect(() => {
    if (verified.success && verified.next) {
      router.replace(verified.next);
      router.refresh();
    }
  }, [verified, router]);
  return checking ? (
    <>
      <p className="forum-help">
        We sent a code to <strong>{codeState.email}</strong>. Check your inbox
        and junk folder.
      </p>
      <form action={verify} className="forum-form">
        <input type="hidden" name="email" value={codeState.email} />
        <input type="hidden" name="next" value={next} />
        <label>
          Sign-in code
          <input
            name="code"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6,10}"
            minLength={6}
            maxLength={10}
            required
            placeholder="Enter your email code"
            autoFocus
          />
        </label>
        <LoginSubmit label="Verify & join" />
        {verified.message && (
          <p role={verified.success ? "status" : "alert"}>{verified.message}</p>
        )}
      </form>
      <button
        type="button"
        className="forum-text-button"
        onClick={() => setRestart(true)}
      >
        Use another email or request a new code
      </button>
    </>
  ) : (
    <form action={request} className="forum-form">
      <label>
        SMU email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="you@smu.edu"
        />
      </label>
      <p className="forum-help">
        We’ll send you a sign-in code. No new password to remember.
      </p>
      <LoginSubmit label="Send sign-in code" />
      {codeState.message && <p role="status">{codeState.message}</p>}
    </form>
  );
}
