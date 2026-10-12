"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="container section">
      <p className="eyebrow">A temporary interruption</p>
      <h1>This page couldn’t load.</h1>
      <p>Please try again, or check the council’s Council archive</p>
      <div className="hero-actions">
        <button className="button" onClick={reset}>
          Try again ↗
        </button>
        <a className="text-link" href="https://blog.smu.edu/chemgrads/">
          Open council archive
        </a>
      </div>
    </section>
  );
}
