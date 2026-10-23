"use client";
export default function ForumError({ reset }: { reset: () => void }) {
  return (
    <div className="container forum-container">
      <section className="forum-empty" role="alert">
        <h2>We couldn’t open the community.</h2>
        <p>Please try again in a moment.</p>
        <button type="button" className="forum-primary" onClick={reset}>
          Try again
        </button>
      </section>
    </div>
  );
}
