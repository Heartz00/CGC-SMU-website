import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvents } from "@/lib/content";
import { eventSlug, eventPath } from "@/lib/content/event-links";
import { dateLabel } from "@/components/ui";
import { Flyer } from "@/components/flyer";
import { ShareLink } from "@/components/share-link";
export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };
async function find(props: Props) {
  const { slug } = await props.params;
  return (await getEvents()).items.find((event) => eventSlug(event) === slug);
}
export async function generateMetadata(props: Props): Promise<Metadata> {
  const event = await find(props);
  return {
    title: event?.title || "Event",
    description: event?.description.slice(0, 160),
    ...(event
      ? {
          alternates: { canonical: eventPath(event) },
          openGraph: {
            title: event.title,
            description: event.description.slice(0, 160),
            ...(event.flyer ? { images: [event.flyer] } : {}),
          },
        }
      : {}),
  };
}
export default async function Event(props: Props) {
  const event = await find(props);
  if (!event) notFound();
  return (
    <article className="section container event-detail">
      <Link href="/events" className="text-link">
        ← All events
      </Link>
      <p className="eyebrow">Council event</p>
      <h1>{event.title}</h1>
      <div className="event-detail-grid">
        <div>
          <p>
            <time dateTime={event.start}>
              {dateLabel(event.start, !event.allDay)}
            </time>
            {event.allDay ? " · All day" : " · Dallas time"}
            {event.end && (
              <>
                <br />
                Until{" "}
                <time dateTime={event.end}>
                  {dateLabel(event.end, !event.allDay)}
                </time>
              </>
            )}
          </p>
          <p>
            <strong>Location</strong>
            <br />
            {event.location}
          </p>
          <p className="event-description">{event.description}</p>
          <div className="event-detail-actions">
            {event.registration && (
              <a className="button" href={event.registration}>
                Registration & details ↗
              </a>
            )}
            <a
              className="button button-share"
              href={`${eventPath(event)}/calendar`}
            >
              Add to calendar
            </a>
            <ShareLink />
          </div>
        </div>
        {event.flyer && (
          <Flyer src={event.flyer} alt={`${event.title} flyer`} />
        )}
      </div>
    </article>
  );
}
