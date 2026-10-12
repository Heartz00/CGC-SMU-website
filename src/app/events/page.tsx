import type { Metadata } from "next";
import { getEvents } from "@/lib/content";
import { partitionEvents } from "@/lib/content/adapters";
import { EventCard } from "@/components/content";
import { EmptyState, PageIntro, SectionHeading } from "@/components/ui";
import { site } from "@/lib/site";
import { CollectionSearch } from "@/components/collection-search";
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
        {events.items.length ? (
          <CollectionSearch
            label="events"
            className="event-list"
            defaultGroup={
              upcoming.some((e) => e.status !== "cancelled") ? "Upcoming" : ""
            }
            items={[...upcoming, ...past].map((event) => ({
              id: `${event.title}-${event.start}`,
              text: `${event.title} ${event.description} ${event.location}`,
              group:
                event.status === "cancelled"
                  ? "Cancelled"
                  : upcoming.includes(event)
                    ? "Upcoming"
                    : "Past",
              content: <EventCard event={event} />,
            }))}
          />
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
    </>
  );
}
