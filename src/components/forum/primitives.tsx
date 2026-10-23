"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
export function ForumIcon({
  kind = "chat",
}: {
  kind?: "chat" | "search" | "plus" | "lock" | "arrow" | "shield";
}) {
  const paths = {
    chat: "M4 4h16v12H8l-4 4V4Z",
    search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
    plus: "M12 4v16M4 12h16",
    lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5z",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    shield: "M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z",
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[kind]} />
    </svg>
  );
}
export function ForumAvatar({
  name,
  anonymous = false,
}: {
  name: string;
  anonymous?: boolean;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={`forum-avatar ${anonymous ? "is-anonymous" : ""}`}
    >
      {anonymous ? "?" : initials}
    </span>
  );
}
export function ForumIdentity({
  anonymous,
  onChange,
  name,
}: {
  anonymous: boolean;
  onChange: (value: boolean) => void;
  name: string;
}) {
  return (
    <fieldset className="forum-identity">
      <legend>Post as</legend>
      <label className={!anonymous ? "is-selected" : ""}>
        <input
          type="radio"
          name="postingIdentity"
          value="named"
          checked={!anonymous}
          onChange={() => onChange(false)}
        />
        <span>
          {name}
          <small>Your display name</small>
        </span>
      </label>
      <label className={anonymous ? "is-selected" : ""}>
        <input
          type="radio"
          name="postingIdentity"
          value="anonymous"
          checked={anonymous}
          onChange={() => onChange(true)}
        />
        <span>
          Anonymous<small>Hide your name from members</small>
        </span>
      </label>
      <p>
        Your account stays verified. Moderators can identify authors to address
        reports and abuse.
      </p>
    </fieldset>
  );
}
export function ForumDialog({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    const before = document.body.style.overflow;
    node?.showModal();
    node
      ?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        'input:not([type="radio"]):not([type="hidden"]), textarea',
      )
      ?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = before;
    };
  }, []);
  return createPortal(
    <dialog
      className="forum-dialog"
      ref={dialog}
      aria-labelledby="forum-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header>
        <div>
          <p className="forum-overline">CGC Community</p>
          <h2 id="forum-dialog-title">{title}</h2>
        </div>
        <button
          type="button"
          className="forum-close"
          disabled={busy}
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>
      </header>
      {children}
    </dialog>,
    document.body,
  );
}
export function ForumBody({ body }: { body: string }) {
  return (
    <div className="forum-message">
      {body.split(/(https?:\/\/[^\s<>]+)/g).map((part, i) => {
        if (!/^https?:\/\//.test(part)) return part;
        try {
          const url = new URL(part);
          if (url.username || url.password) return part;
          return (
            <a
              key={i}
              href={url.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              {part}
            </a>
          );
        } catch {
          return part;
        }
      })}
    </div>
  );
}
