"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { forumFetch } from "@/lib/forum/client";
import {
  forumCategories,
  forumDate,
  type ForumDiscussion,
  type ForumPost,
  type ForumProfile,
} from "@/lib/forum/types";
import { ForumAvatar, ForumBody, ForumIdentity, ForumIcon } from "./primitives";
import { ForumComposer } from "./composer";
import { ForumProfileDialog } from "./profile-dialog";
import { ForumReportDialog } from "./report-dialog";
export function ForumDiscussionView({
  initial,
  profile: initialProfile,
}: {
  initial: ForumDiscussion;
  profile: ForumProfile;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [page, setPage] = useState(initial.page);
  const [profile, setProfile] = useState(initialProfile);
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<{
    kind: "topic" | "reply";
    post: ForumPost;
  } | null>(null);
  const [report, setReport] = useState<{
    kind: "topic" | "reply";
    id: string;
  } | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [reload, setReload] = useState(0);
  const sequence = useRef(0);
  const first = useRef(true);
  const replyInput = useRef<HTMLTextAreaElement>(null);
  const requestId = useRef<string | null>(null);
  const requestPayload = useRef("");
  useEffect(() => {
    if (!body || busy) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, [body, busy]);
  useEffect(() => {
    const controller = new AbortController();
    const url = `/api/forum/topics/${initial.topic.id}?page=${page}`;
    async function refresh() {
      const current = ++sequence.current;
      try {
        const next = await forumFetch<ForumDiscussion>(url, {
          signal: controller.signal,
        });
        if (current !== sequence.current) return;
        setData(next);
      } catch (reason) {
        if (controller.signal.aborted) return;
        const status = (reason as Error & { status?: number }).status;
        if (status === 401) {
          router.replace(
            `/forum/login?next=${encodeURIComponent(`/forum/${initial.topic.id}`)}`,
          );
          return;
        }
        if (status === 404) {
          setNotice("This discussion is no longer available.");
          return;
        }
        setNotice(
          reason instanceof Error
            ? reason.message
            : "Could not refresh replies.",
        );
      }
    }
    if (first.current) first.current = false;
    else {
      window.history.replaceState(
        null,
        "",
        `/forum/${initial.topic.id}${page > 1 ? `?page=${page}` : ""}`,
      );
      void refresh();
    }
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [initial.topic.id, page, reload, router]);
  async function remove(kind: "topic" | "reply", id: string) {
    if (
      !window.confirm(
        kind === "topic"
          ? "Remove this discussion and its replies from the forum?"
          : "Remove your reply?",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await forumFetch(
        `/api/forum/${kind === "topic" ? "topics" : "replies"}/${id}`,
        { method: "DELETE" },
      );
      if (kind === "topic") router.push("/forum");
      else setReload((value) => value + 1);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not remove your post.",
      );
    } finally {
      setBusy(false);
    }
  }
  function actions(post: ForumPost, kind: "topic" | "reply") {
    if (post.removed) return null;
    return (
      <div className="forum-post-actions">
        {post.is_mine ? (
          <>
            {!data.topic.locked && (
              <button
                type="button"
                onClick={() => setEditing({ kind, post })}
                disabled={busy}
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => void remove(kind, post.id)}
              disabled={busy}
            >
              Remove
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setReport({ kind, id: post.id })}
          >
            Report
          </button>
        )}
      </div>
    );
  }
  const topic = data.topic;
  return (
    <div className="forum-discussion-wrap">
      <div className="forum-breadcrumbs">
        <Link href="/forum">All discussions</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/forum?category=${topic.category}`}>
          {forumCategories.find((item) => item.id === topic.category)?.label ||
            topic.category}
        </Link>
      </div>
      <article className="forum-opening-post">
        <div className="forum-topic-meta">
          <span className="forum-category-pill">
            {forumCategories.find((item) => item.id === topic.category)?.label}
          </span>
          {topic.pinned && <span className="forum-pin">Pinned</span>}
          {topic.locked && (
            <span className="forum-locked">
              <ForumIcon kind="lock" />
              Closed
            </span>
          )}
        </div>
        <h2>{topic.title}</h2>
        <div className="forum-post-header">
          <ForumAvatar name={topic.author_label} anonymous={topic.anonymous} />
          <div>
            <strong>
              {topic.author_label}
              {topic.is_mine ? " · You" : ""}
            </strong>
            <div>
              <time dateTime={topic.created_at}>
                {forumDate(topic.created_at)}
              </time>
              {topic.edited_at && <span> · Edited</span>}
            </div>
          </div>
        </div>
        <ForumBody body={topic.body} />
        {actions(topic, "topic")}
      </article>
      <div className="forum-replies-heading">
        <h3>
          {data.total} {data.total === 1 ? "reply" : "replies"}
        </h3>
        <span>Replies refresh automatically</span>
      </div>
      {notice && (
        <p className="forum-help" role="status">
          {notice}
        </p>
      )}
      <div className="forum-replies">
        {data.replies.map((post) => (
          <article
            className={`forum-reply ${post.removed ? "is-removed" : ""}`}
            key={post.id}
          >
            <div className="forum-post-header">
              <ForumAvatar
                name={post.author_label}
                anonymous={post.anonymous}
              />
              <div>
                <strong>
                  {post.author_label}
                  {post.is_mine ? " · You" : ""}
                </strong>
                {!post.removed && post.author_label === topic.author_label && (
                  <span className="forum-op">Author</span>
                )}
                <div>
                  <time dateTime={post.created_at}>
                    {forumDate(post.created_at)}
                  </time>
                  {post.edited_at && <span> · Edited</span>}
                </div>
              </div>
            </div>
            <ForumBody body={post.body} />
            {actions(post, "reply")}
          </article>
        ))}
      </div>
      {data.total > 50 && (
        <nav className="forum-pagination" aria-label="Reply pages">
          <button
            type="button"
            className="forum-secondary"
            disabled={page <= 1 || busy}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {Math.min(500, Math.ceil(data.total / 50))}
          </span>
          <button
            type="button"
            className="forum-secondary"
            disabled={page >= Math.min(500, Math.ceil(data.total / 50)) || busy}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </nav>
      )}
      {error && (
        <p className="forum-error" role="alert">
          {error}
        </p>
      )}
      {topic.locked ? (
        <div className="forum-closed-note">
          <ForumIcon kind="lock" />
          <p>This discussion is closed to new replies.</p>
        </div>
      ) : !profile.name_ready ? (
        <div className="forum-onboarding">
          <p>Choose a display name before joining the conversation.</p>
          <button
            type="button"
            className="forum-primary"
            onClick={() => setEditProfile(true)}
          >
            Set display name
          </button>
        </div>
      ) : (
        <form
          className="forum-reply-composer forum-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              const payload = JSON.stringify({ body, anonymous });
              if (payload !== requestPayload.current) requestId.current = null;
              requestId.current ||= crypto.randomUUID();
              requestPayload.current = payload;
              const result = await forumFetch<{ id: string; page: number }>(
                "/api/forum/replies",
                {
                  method: "POST",
                  body: JSON.stringify({
                    topicId: topic.id,
                    body,
                    anonymous,
                    requestId: requestId.current,
                  }),
                },
              );
              setBody("");
              requestId.current = null;
              setPage(result.page);
              setReload((value) => value + 1);
              setNotice("Your reply was posted.");
            } catch (reason) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Could not post. Your reply is kept here.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy}>
            <label>
              Add your reply
              <textarea
                ref={replyInput}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                minLength={2}
                maxLength={8000}
                rows={4}
                required
                placeholder="Keep the conversation going…"
              />
            </label>
            <ForumIdentity
              anonymous={anonymous}
              onChange={setAnonymous}
              name={profile.display_name}
            />
            <div className="forum-form-actions">
              <small>{body.length.toLocaleString("en-US")} / 8,000</small>
              <button className="forum-primary">
                {busy ? "Posting…" : "Post reply"}
                <ForumIcon kind="arrow" />
              </button>
            </div>
          </fieldset>
        </form>
      )}
      <p className="forum-bottom-note">
        Keep it helpful and respectful.{" "}
        <Link href="/forum/guidelines">Read the community guidelines.</Link>
      </p>
      {editing && (
        <ForumComposer
          name={profile.display_name}
          post={editing.post}
          kind={editing.kind}
          category={topic.category}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setReload((value) => value + 1);
          }}
        />
      )}
      {report && (
        <ForumReportDialog {...report} onClose={() => setReport(null)} />
      )}
      {editProfile && (
        <ForumProfileDialog
          profile={profile}
          onClose={() => setEditProfile(false)}
          onSaved={(updated) => {
            setProfile(updated);
            setEditProfile(false);
          }}
        />
      )}
    </div>
  );
}
