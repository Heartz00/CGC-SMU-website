"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { forumFetch } from "@/lib/forum/client";
import {
  forumCategories,
  forumDate,
  type ForumList,
  type ForumProfile,
} from "@/lib/forum/types";
import { ForumAvatar, ForumIcon } from "./primitives";
import { ForumComposer } from "./composer";
import { ForumProfileDialog } from "./profile-dialog";
export function ForumBoard({
  initial,
  profile: initialProfile,
  initialCategory = "",
  initialQuery = "",
  initialSort = "active",
}: {
  initial: ForumList;
  profile: ForumProfile;
  initialCategory?: string;
  initialQuery?: string;
  initialSort?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [profile, setProfile] = useState(initialProfile);
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(initial.page);
  const [composer, setComposer] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const first = useRef(true);
  const sequence = useRef(0);
  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (query) params.set("q", query);
    if (sort !== "active") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    const endpoint = `/api/forum/topics?${params}`;
    const controller = new AbortController();
    async function refresh(visible: boolean) {
      const current = ++sequence.current;
      if (visible) setBusy(true);
      try {
        const result = await forumFetch<ForumList>(endpoint, {
          signal: controller.signal,
        });
        if (current !== sequence.current) return;
        setData(result);
        setError("");
      } catch (reason) {
        if (controller.signal.aborted) return;
        if ((reason as Error & { status?: number }).status === 401) {
          setData({ ...initial, topics: [], total: 0 });
          router.replace("/forum/login");
          return;
        }
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not refresh discussions.",
        );
      } finally {
        if (current === sequence.current) setBusy(false);
      }
    }
    if (first.current) first.current = false;
    else {
      window.history.replaceState(
        null,
        "",
        `/forum${params.size ? `?${params}` : ""}`,
      );
      void refresh(true);
    }
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh(false);
    }, 15000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
    // Initial content is supplied by the server; filter changes and polling use the private API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, sort, page, router]);
  const selected = forumCategories.find((item) => item.id === category);
  const start = () => {
    if (!profile.name_ready) setEditProfile(true);
    else setComposer(true);
  };
  return (
    <div className="forum-layout">
      <aside className="forum-sidebar">
        <div className="forum-channel-heading">Your spaces</div>
        <nav aria-label="Forum channels">
          <button
            type="button"
            className={!category ? "is-active" : ""}
            aria-pressed={!category}
            onClick={() => {
              setCategory("");
              setPage(1);
            }}
          >
            <ForumIcon />
            <span>All discussions</span>
          </button>
          {forumCategories.map((item) => (
            <button
              type="button"
              key={item.id}
              className={category === item.id ? "is-active" : ""}
              aria-pressed={category === item.id}
              onClick={() => {
                setCategory(item.id);
                setPage(1);
              }}
            >
              <span className="forum-channel-hash" aria-hidden="true">
                #
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="forum-sidebar-note">
          <ForumIcon kind="shield" />
          <strong>A shared space. A little trust.</strong>
          <p>
            Be kind, protect others’ privacy, and keep the conversation useful.
          </p>
          <Link href="/forum/guidelines">Community guidelines ↗</Link>
        </div>
      </aside>
      <section className="forum-feed" aria-labelledby="forum-feed-title">
        <div className="forum-feed-heading">
          <div>
            <p className="forum-overline">Student conversations</p>
            <h2 id="forum-feed-title">
              {selected?.label || "All discussions"}
            </h2>
            <p>
              {selected?.description ||
                "Questions, connections, and useful things to share."}
            </p>
          </div>
          <button type="button" className="forum-primary" onClick={start}>
            <ForumIcon kind="plus" />
            New discussion
          </button>
        </div>
        {!profile.name_ready && (
          <div className="forum-onboarding">
            <div>
              <strong>Welcome to your community.</strong>
              <p>
                Choose a display name to start posting. Anonymous posting is
                always your choice.
              </p>
            </div>
            <button
              type="button"
              className="forum-secondary"
              onClick={() => setEditProfile(true)}
            >
              Set display name
            </button>
          </div>
        )}
        <div className="forum-toolbar">
          <form
            className="forum-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(search.trim());
              setPage(1);
            }}
          >
            <label className="sr-only" htmlFor="forum-search">
              Search discussions
            </label>
            <ForumIcon kind="search" />
            <input
              id="forum-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations…"
              maxLength={120}
            />
            <button type="submit">Search</button>
          </form>
          <label className="forum-sort">
            <span>Sort by</span>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
            >
              <option value="active">Recently active</option>
              <option value="newest">Newest first</option>
            </select>
          </label>
        </div>
        <div className="forum-results-line">
          <span role="status">
            {busy
              ? "Loading discussions…"
              : `${data.total} ${data.total === 1 ? "discussion" : "discussions"}`}
          </span>
          <button
            type="button"
            className="forum-text-button"
            onClick={() => setEditProfile(true)}
          >
            {profile.display_name} · Edit profile
          </button>
        </div>
        {error && (
          <p className="forum-error" role="alert">
            {error}
          </p>
        )}
        <div
          className={`forum-topic-list ${busy ? "is-loading" : ""}`}
          aria-busy={busy}
        >
          {data.topics.map((topic) => (
            <article className="forum-topic-card" key={topic.id}>
              <ForumAvatar
                name={topic.author_label}
                anonymous={topic.anonymous}
              />
              <div className="forum-topic-main">
                <div className="forum-topic-meta">
                  <span className="forum-category-pill">
                    {forumCategories.find((item) => item.id === topic.category)
                      ?.label || topic.category}
                  </span>
                  {topic.pinned && <span className="forum-pin">Pinned</span>}
                  {topic.locked && (
                    <span className="forum-locked">
                      <ForumIcon kind="lock" />
                      Closed
                    </span>
                  )}
                </div>
                <h3>
                  <Link href={`/forum/${topic.id}`}>{topic.title}</Link>
                </h3>
                <p className="forum-topic-excerpt">{topic.body}</p>
                <div className="forum-author-line">
                  <span>
                    {topic.author_label}
                    {topic.is_mine ? " · You" : ""}
                  </span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={topic.last_activity}>
                    {forumDate(topic.last_activity)}
                  </time>
                </div>
              </div>
              <Link
                className="forum-reply-count"
                href={`/forum/${topic.id}`}
                aria-label={`${topic.reply_count} replies to ${topic.title}`}
              >
                <ForumIcon />
                <strong>{topic.reply_count}</strong>
                <span>replies</span>
              </Link>
            </article>
          ))}
        </div>
        {!data.topics.length && !busy && (
          <div className="forum-empty">
            <ForumIcon />
            <h3>
              {query
                ? "No matching conversations"
                : "Be the first to say hello."}
            </h3>
            <p>
              {query
                ? "Try another search or explore a different channel."
                : "Share a question, an introduction, or something your fellow graduates should know."}
            </p>
            {query ? (
              <button
                type="button"
                className="forum-secondary"
                onClick={() => {
                  setQuery("");
                  setSearch("");
                  setCategory("");
                  setPage(1);
                }}
              >
                Clear filters
              </button>
            ) : (
              <button type="button" className="forum-primary" onClick={start}>
                Start a conversation
              </button>
            )}
          </div>
        )}
        {data.total > 20 && (
          <nav className="forum-pagination" aria-label="Discussion pages">
            <button
              type="button"
              className="forum-secondary"
              disabled={page <= 1 || busy}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {Math.min(500, Math.ceil(data.total / 20))}
            </span>
            <button
              type="button"
              className="forum-secondary"
              disabled={
                page >= Math.min(500, Math.ceil(data.total / 20)) || busy
              }
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </button>
          </nav>
        )}
      </section>
      {composer && (
        <ForumComposer
          name={profile.display_name}
          category={category || "general"}
          onClose={() => setComposer(false)}
          onSaved={(id) => {
            setComposer(false);
            if (id) router.push(`/forum/${id}`);
          }}
        />
      )}
      {editProfile && (
        <ForumProfileDialog
          profile={profile}
          onClose={() => setEditProfile(false)}
          onSaved={(updated) => {
            setProfile(updated);
            setEditProfile(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
