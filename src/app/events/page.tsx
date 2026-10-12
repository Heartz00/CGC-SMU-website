import type { Metadata } from "next";
import { getEvents } from "@/lib/content";
import { partitionEvents } from "@/lib/content/adapters";
import { EventCard } from "@/components/content";
import { EmptyState, PageIntro, SectionHeading } from "@/components/ui";
import { site } from "@/lib/site";
export const metadata: Metadata = { title: "Events" };
export const revalidate = 300;
export default async function Events() {
  const events = await getEvents();
  const { upcoming, past } = partitionEvents(events.items);
  return (
    <>
      <PageIntro label="Events & meetings" title="Connect beyond the lab.">
        <p>
          Meetings, shared science, and time together. Find your next
          opportunity to get involved.
        </p>
      </PageIntro>
      <section className="section container">
        <SectionHeading label="Coming up" title="On the calendar." />
        <p className="section-note">
          All event times are displayed in Dallas local time.
        </p>
        {upcoming.length ? (
          <div className="event-list">
            {upcoming.map((event) => (
              <EventCard key={`${event.title}-${event.start}`} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No upcoming events are listed here."
            href={`${site.wordpress}/upcoming-cgc-events/`}
            linkText="Visit the council calendar"
          >
            {events.unavailable
              ? "Events are temporarily unavailable. Check the council calendar."
              : "Check the council calendar, or suggest an event."}
          </EmptyState>
        )}
      </section>
      {past.length > 0 && (
        <section className="section section-tinted">
          <div className="container">
            <SectionHeading label="Looking back" title="Past gatherings." />
            <div className="event-list">
              {past.map((event) => (
                <EventCard
                  key={`${event.title}-${event.start}`}
                  event={event}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
