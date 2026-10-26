import Link from "next/link";
import { signOutForum } from "@/app/forum/actions";
export function ForumHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="forum-page-header">
      <div>
        <Link href="/forum" className="forum-overline">
          CGC Community
        </Link>
        <h1>A conversation beyond the lab.</h1>
        <p>
          Your place to ask, connect, and share with fellow SMU graduate
          students.
        </p>
      </div>
      <div className="forum-membership">
        <span>
          <span className="forum-status-dot" />
          Student community
        </span>
        {signedIn ? (
          <form action={signOutForum}>
            <button type="submit" className="forum-text-button">
              Sign out
            </button>
          </form>
        ) : (
          <Link href="/forum/guidelines">How this space works ↗</Link>
        )}
      </div>
    </header>
  );
}
