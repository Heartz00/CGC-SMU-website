import Link from "next/link";
export default function ForumNotFound() {
  return (
    <div className="container forum-container">
      <section className="forum-empty">
        <h1>This discussion isn’t available.</h1>
        <p>It may have been removed or the link may be incomplete.</p>
        <Link href="/forum" className="forum-primary">
          Back to discussions
        </Link>
      </section>
    </div>
  );
}
