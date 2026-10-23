import Link from "next/link";
import { notFound } from "next/navigation";
import { ForumHeader } from "@/components/forum/header";
import { ForumDiscussionView } from "@/components/forum/discussion";
import { requireForum, forumProfile, forumRpc } from "@/lib/forum/server";
import { forumId, pageNumber, ForumError } from "@/lib/forum/validation";
import type { ForumDiscussion } from "@/lib/forum/types";
export default async function Discussion({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  try {
    forumId(id);
  } catch {
    notFound();
  }
  const { client } = await requireForum(`/forum/${id}`);
  const query = await searchParams;
  let result;
  try {
    const [profile, discussion] = await Promise.all([
      forumProfile(client),
      forumRpc<ForumDiscussion | null>(client, "cgc_forum_discussion", {
        p_id: id,
        p_page: pageNumber(query.page),
      }),
    ]);
    result = { profile, discussion };
  } catch (error) {
    return (
      <div className="container forum-container">
        <ForumHeader signedIn />
        <section className="forum-empty">
          <h2>This discussion couldn’t be loaded.</h2>
          <p>
            {error instanceof ForumError ? error.message : "Please try again."}
          </p>
          <Link href="/forum" className="forum-secondary">
            Back to discussions
          </Link>
        </section>
      </div>
    );
  }
  if (!result.discussion) notFound();
  return (
    <div className="container forum-container">
      <ForumHeader signedIn />
      <ForumDiscussionView
        initial={result.discussion}
        profile={result.profile}
      />
    </div>
  );
}
