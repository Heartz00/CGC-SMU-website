import Link from "next/link";
import type { ReactNode } from "react";

export function Arrow() {
  return <span aria-hidden="true">↗</span>;
}
export function ButtonLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  const className = `button${secondary ? " button-secondary" : ""}`;
  return href.startsWith("/") ? (
    <Link className={className} href={href}>
      {children}
      <Arrow />
    </Link>
  ) : (
    <a className={className} href={href}>
      {children}
      <Arrow />
    </a>
  );
}
export function PageIntro({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="page-intro">
      <div className="container">
        <p className="eyebrow">{label}</p>
        <h1>{title}</h1>
        <div className="intro-copy">{children}</div>
      </div>
    </section>
  );
}
export function SectionHeading({
  label,
  title,
  href,
  linkText,
}: {
  label: string;
  title: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{label}</p>
        <h2>{title}</h2>
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {linkText || "Explore"} <Arrow />
        </Link>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  children,
  href,
  linkText,
}: {
  title: string;
  children: ReactNode;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        ✳
      </span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
        {href && (
          <a className="text-link" href={href}>
            {linkText || "Visit the council archive"} <Arrow />
          </a>
        )}
      </div>
    </div>
  );
}
export function dateLabel(date: string, includeTime = false) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...(includeTime
      ? { hour: "numeric", minute: "2-digit", timeZoneName: "short" as const }
      : {}),
    timeZone: includeTime ? "America/Chicago" : "UTC",
  }).format(new Date(date.length === 10 ? `${date}T12:00:00Z` : date));
}
