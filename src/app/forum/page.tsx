import Link from "next/link";
import { ForumBoard } from "@/components/forum/board";
import { ForumHeader } from "@/components/forum/header";
import { requireForum, forumProfile, forumRpc } from "@/lib/forum/server";
import { pageNumber, ForumError } from "@/lib/forum/validation";
import { forumCategories, type ForumList } from "@/lib/forum/types";
export default async function Forum({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const query = await searchParams;
  const { client } = await requireForum();
  const category = forumCategories.some((item) => item.id === query.category)
    ? query.category!
    : "";
  const search = (query.q || "").slice(0, 120);
  const sort = query.sort === "newest" ? "newest" : "active";
  let result;
  try {
    const [profile, feed] = await Promise.all([
      forumProfile(client),
      forumRpc<ForumList>(client, "cgc_forum_feed", {
        p_category: category,
        p_search: search,
        p_sort: sort,
        p_page: pageNumber(query.page),
      }),
    ]);
    result = { profile, feed };
  } catch (error) {
    return (
      <div className="container forum-container">
        <ForumHeader signedIn />
        <section className="forum-empty">
          <h2>We couldn’t open the community.</h2>
          <p>
            {error instanceof ForumError
              ? error.message
              : "Please try again in a moment."}
          </p>
          <Link className="forum-secondary" href="/forum">
            Try again
          </Link>
          <Link className="forum-text-button" href="/contact">
            Contact the council
          </Link>
        </section>
      </div>
    );
  }
  return (
    <div className="container forum-container">
      <ForumHeader signedIn />
      <ForumBoard
        initial={result.feed}
        profile={result.profile}
        initialCategory={category}
        initialQuery={search}
        initialSort={sort}
      />
    </div>
  );
}
