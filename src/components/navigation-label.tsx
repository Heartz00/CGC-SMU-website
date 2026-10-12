"use client";
import { useLinkStatus } from "next/link";
export function NavigationLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className="navigation-label" aria-busy={pending}>
      {label}
      <span
        className={`navigation-progress ${pending ? "is-pending" : ""}`}
        aria-hidden="true"
      />
      <span className="sr-only" role="status">
        {pending ? `Loading ${label}…` : ""}
      </span>
    </span>
  );
}
