import Link from "next/link";
import { redirect } from "next/navigation";
import { forumEnabled } from "@/lib/forum/config";
import { forumSession, forumProfile } from "@/lib/forum/server";
import { safeForumNext, ForumError } from "@/lib/forum/validation";
import { ForumLoginForm } from "@/components/forum/login-form";
import { ForumIcon } from "@/components/forum/primitives";
import { signOutForum } from "../actions";
export default async function ForumLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeForumNext((await searchParams).next);
  let membershipError = "";
  const session = await forumSession();
  if (session) {
    try {
      await forumProfile(session.client);
    } catch (error) {
      membershipError =
        error instanceof ForumError
          ? error.message
          : "Your account could not be checked.";
    }
    if (!membershipError) redirect(next);
  }
  return (
    <div className="container forum-login">
      <section className="forum-login-intro">
        <p className="forum-overline">CGC Community</p>
        <h1>
          Find your people.
          <br />
          <em>Join the conversation.</em>
        </h1>
        <p>
          A private forum for the SMU graduate community. Share opportunities,
          ask questions, and connect beyond your research group.
        </p>
        <div className="forum-login-benefits">
          <div>
            <ForumIcon kind="shield" />
            <span>
              <strong>A student community</strong>Create an account with your
              SMU email.
            </span>
          </div>
          <div>
            <ForumIcon kind="chat" />
            <span>
              <strong>Your voice, your choice</strong>Post with your name or
              anonymously.
            </span>
          </div>
          <div>
            <ForumIcon kind="lock" />
            <span>
              <strong>A little more privacy</strong>Conversations stay inside
              the forum.
            </span>
          </div>
        </div>
        <Link href="/forum/guidelines">Read our community guidelines ↗</Link>
      </section>
      <section
        className="forum-login-card"
        aria-labelledby="forum-login-heading"
      >
        <span className="forum-login-icon">
          <ForumIcon />
        </span>
        <h2 id="forum-login-heading">Your community starts here.</h2>
        <p>Sign in with your SMU email to read and join discussions.</p>
        {membershipError ? (
          <>
            <p className="forum-error" role="alert">
              {membershipError}
            </p>
            <form action={signOutForum}>
              <button className="forum-secondary">Sign out</button>
            </form>
            <Link href="/contact">Contact the council</Link>
          </>
        ) : forumEnabled() ? (
          <ForumLoginForm next={next} />
        ) : (
          <div className="forum-setup-note" role="status">
            <strong>Our student forum is getting ready.</strong>
            <p>
              Sign-in will open once the council finishes setting up this space.
              Please check back soon.
            </p>
            <Link href="/contact">Get in touch ↗</Link>
          </div>
        )}
        <p className="forum-login-privacy">
          Anonymous posts hide your name from other members. Moderators can
          identify authors to address reports and abuse.
        </p>
      </section>
    </div>
  );
}
