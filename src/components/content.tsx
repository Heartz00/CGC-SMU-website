import Image from "next/image";
import Link from "next/link";
import type { Announcement, CouncilEvent, Officer } from "@/lib/content/types";
import { Arrow, dateLabel } from "./ui";
import { Flyer } from "./flyer";
import { eventPath } from "@/lib/content/event-links";

export function NewsCard({
  post,
  featured = false,
}: {
  post: Announcement;
  featured?: boolean;
}) {
  const href = post.local ? `/news/${post.slug}` : post.url;
  return (
    <article className="news-card">
      {post.flyer && (
        <Flyer src={post.flyer} alt={post.flyerAlt || `${post.title} flyer`} />
      )}
      <div className="card-meta">
        <span>{featured ? "Featured announcement" : "Announcement"}</span>
        <time dateTime={post.date}>{dateLabel(post.date)}</time>
      </div>
      <h3>
        {post.local ? (
          <Link href={href}>{post.title}</Link>
        ) : (
          <a href={href}>{post.title}</a>
        )}
      </h3>
      <p>{post.excerpt}</p>
      {post.local ? (
        <Link className="text-link" href={href}>
          Read announcement <Arrow />
        </Link>
      ) : (
        <a className="text-link" href={href}>
          Read in the archive <Arrow />
        </a>
      )}
    </article>
  );
}
export function EventCard({
  event,
  featured = false,
}: {
  event: CouncilEvent;
  featured?: boolean;
}) {
  const start = new Date(event.start);
  return (
    <article className={`event-card ${event.flyer ? "has-flyer" : ""}`}>
      <div className="date-tile">
        <span>
          {start.toLocaleDateString("en-US", {
            month: "short",
            timeZone: "America/Chicago",
          })}
        </span>
        <strong>
          {start.toLocaleDateString("en-US", {
            day: "numeric",
            timeZone: "America/Chicago",
          })}
        </strong>
      </div>
      <div className="event-content">
        {featured && <p className="eyebrow">Featured event</p>}
        <h3>
          <Link href={eventPath(event)}>{event.title}</Link>
        </h3>
        <p className="event-meta">
          <time dateTime={event.start}>
            {dateLabel(event.start, !event.allDay)}
          </time>
          {event.allDay && " · All day"}
          <br />
          {event.location}
        </p>
        <p>{event.description}</p>
        <p>
          <Link className="text-link" href={eventPath(event)}>
            View event <Arrow />
          </Link>
        </p>
        {event.registration && (
          <a className="button" href={event.registration}>
            Registration & details <Arrow />
          </a>
        )}
        {!event.registration && event.url && (
          <a className="text-link" href={event.url}>
            Event details <Arrow />
          </a>
        )}
      </div>
      {event.flyer && <Flyer src={event.flyer} alt={`${event.title} flyer`} />}
    </article>
  );
}
export function OfficerCard({ officer }: { officer: Officer }) {
  const initials = officer.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <article className="officer-card">
      <div className="officer-photo">
        {officer.photo ? (
          <Image
            src={officer.photo}
            alt={officer.name}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1000px) 45vw, 30vw"
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </div>
      <div className="officer-body">
        <p className="eyebrow">{officer.role}</p>
        <h2>{officer.name}</h2>
        {officer.term && <p className="term">{officer.term}</p>}
        {officer.termStart && officer.termEnd && (
          <p className="term">
            {dateLabel(`${officer.termStart}T12:00:00Z`)} –{" "}
            {dateLabel(`${officer.termEnd}T12:00:00Z`)}
          </p>
        )}
        {officer.bio && <p>{officer.bio}</p>}
        {officer.email && (
          <a className="text-link" href={`mailto:${officer.email}`}>
            Contact {officer.name.split(" ")[0]} <Arrow />
          </a>
        )}
      </div>
    </article>
  );
}
