import Link from "next/link";
export default function Guidelines() {
  return (
    <div className="container forum-guidelines">
      <p className="forum-overline">CGC Community</p>
      <h1>A good conversation starts with respect.</h1>
      <p className="forum-guidelines-lead">
        This is a shared space for SMU graduate students to help one another,
        exchange ideas, and build community.
      </p>
      <div className="forum-guideline-grid">
        <article>
          <h2>Be thoughtful. Be kind.</h2>
          <p>
            Discuss ideas respectfully. Harassment, discrimination, personal
            attacks, spam, and impersonation do not belong here.
          </p>
        </article>
        <article>
          <h2>Choose how you show up.</h2>
          <p>
            Use a display name or choose Anonymous for each discussion and
            reply. Anonymous posts use a consistent alias within that
            discussion, but different aliases across discussions.
          </p>
          <p>
            Your account is still linked to your posts privately. Moderators can
            identify authors to investigate reports and manage abuse. This is
            not an untraceable or end-to-end encrypted chat service.
          </p>
        </article>
        <article>
          <h2>Protect each other’s privacy.</h2>
          <p>
            Do not share someone else’s personal details, private messages,
            credentials, or confidential research. Email ownership is not
            currently verified. Posts are visible to signed-in forum members;
            avoid sharing anything you would not want another member to copy.
          </p>
        </article>
        <article>
          <h2>Help keep the space useful.</h2>
          <p>
            Choose the channel that fits, use a clear title, and check for an
            existing discussion before starting another. Council announcements
            and official events stay on their dedicated website pages.
          </p>
        </article>
        <article>
          <h2>Report a concern.</h2>
          <p>
            Use Report on a post to contact moderators privately. Reports are
            reviewed by authorized council administrators, who can hide posts,
            close discussions, or suspend access. Your report is not shown to
            the post’s author.
          </p>
        </article>
        <article>
          <h2>Your content, your choice.</h2>
          <p>
            You can edit or remove your own posts. Removed replies leave a
            placeholder to keep conversations understandable. Moderators retain
            restricted records of edits, removals, and moderation actions for
            accountability.
          </p>
        </article>
      </div>
      <div className="forum-guidelines-actions">
        <Link className="forum-primary" href="/forum">
          Go to the forum
        </Link>
        <Link className="forum-secondary" href="/contact">
          Contact the council
        </Link>
      </div>
    </div>
  );
}
