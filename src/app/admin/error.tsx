"use client";
import Link from "next/link";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <section className="container section">
      <p className="eyebrow">Council workspace</p>
      <h1>Could not load this page.</h1>
      <p>
        Please retry when the connection is available. No save was completed by
        opening this page.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
      <p>
        <Link href="/admin">Return to dashboard</Link>
      </p>
    </section>
  );
}
