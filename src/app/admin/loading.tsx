export default function AdminLoading() {
  return (
    <section className="container section" role="status" aria-live="polite">
      <p className="eyebrow">Council workspace</p>
      <p className="large-copy">Opening your workspace…</p>
      <div className="admin-loading-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
