"use client";
import { useEffect, useRef, useState } from "react";
import { forumFetch } from "@/lib/forum/client";
import {
  forumCategories,
  type ForumTopic,
  type ForumPost,
} from "@/lib/forum/types";
import { ForumDialog, ForumIdentity } from "./primitives";
export function ForumComposer({
  name,
  category = "general",
  post,
  kind = "topic",
  onClose,
  onSaved,
}: {
  name: string;
  category?: string;
  post?: ForumTopic | ForumPost;
  kind?: "topic" | "reply";
  onClose: () => void;
  onSaved: (id?: string) => void;
}) {
  const [title, setTitle] = useState(post && "title" in post ? post.title : "");
  const [body, setBody] = useState(post?.body || "");
  const [channel, setChannel] = useState(category);
  const [anonymous, setAnonymous] = useState(post?.anonymous || false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef<string | null>(null);
  const requestPayload = useRef("");
  const dirty =
    body !== (post?.body || "") ||
    title !== (post && "title" in post ? post.title : "") ||
    anonymous !== (post?.anonymous || false);
  useEffect(() => {
    if (!dirty || busy) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, [dirty, busy]);
  const close = () => {
    if (!busy && (!dirty || window.confirm("Discard your unfinished message?")))
      onClose();
  };
  return (
    <ForumDialog
      title={post ? "Edit your post" : "Start a conversation"}
      onClose={close}
      busy={busy}
    >
      <form
        className="forum-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const payload = JSON.stringify({ title, body, channel, anonymous });
            if (payload !== requestPayload.current) requestId.current = null;
            requestId.current ||= crypto.randomUUID();
            requestPayload.current = payload;
            const result = await forumFetch<{ id?: string }>(
              post
                ? `/api/forum/${kind === "topic" ? "topics" : "replies"}/${post.id}`
                : "/api/forum/topics",
              {
                method: post ? "PATCH" : "POST",
                body: JSON.stringify({
                  title,
                  body,
                  category: channel,
                  anonymous,
                  requestId: requestId.current,
                  version: post?.edited_at || post?.created_at,
                }),
              },
            );
            onSaved(result.id);
          } catch (reason) {
            setError(
              reason instanceof Error
                ? reason.message
                : "Could not post. Your message is kept here.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy}>
          {kind === "topic" && (
            <>
              <label>
                Channel
                <select
                  value={channel}
                  onChange={(event) => setChannel(event.target.value)}
                  disabled={!!post}
                >
                  {forumCategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Discussion title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  minLength={4}
                  maxLength={160}
                  placeholder="What would you like to share?"
                  autoFocus
                />
              </label>
            </>
          )}
          <label>
            {post
              ? "Message"
              : "Share a thought, question, or useful information"}
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              minLength={2}
              maxLength={8000}
              rows={7}
              placeholder="Start the conversation…"
              autoFocus={kind === "reply"}
            />
          </label>
          <small className="forum-character-count">
            {body.length.toLocaleString("en-US")} / 8,000
          </small>
          <ForumIdentity
            anonymous={anonymous}
            onChange={setAnonymous}
            name={name}
          />
          <div className="forum-form-actions">
            <button type="button" className="forum-secondary" onClick={close}>
              Cancel
            </button>
            <button className="forum-primary">
              {busy ? "Posting…" : post ? "Save changes" : "Post discussion"}
            </button>
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="forum-error">
            {error}
          </p>
        )}
      </form>
    </ForumDialog>
  );
}
