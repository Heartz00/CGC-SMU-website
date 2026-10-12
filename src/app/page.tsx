import Link from "next/link";
import { getAnnouncements, getEvents } from "@/lib/content";
import { partitionEvents } from "@/lib/content/adapters";
import { AnimatedMolecule } from "@/components/animated-molecule";
import { EventCard, NewsCard } from "@/components/content";
import { Arrow, ButtonLink, EmptyState, SectionHeading } from "@/components/ui";
import { site } from "@/lib/site";
import { getHomeSettings } from "@/lib/content/council-settings";
import { featureFirst } from "@/lib/content/home-settings";
import { eventSlug } from "@/lib/content/event-links";
import { LandingMotion } from "@/components/landing-motion";
import { standaloneAnnouncements } from "@/lib/content/announcement-events";
export const revalidate = 300;

export default async function Home() {
  const [news, events, settings] = await Promise.all([
    getAnnouncements(),
    getEvents(),
    getHomeSettings(),
  ]);
  const upcoming = featureFirst(
    partitionEvents(events.items).upcoming.filter(
      (event) => event.status !== "cancelled",
    ),
    settings.featuredEvent,
    eventSlug,
  );
  const posts = featureFirst(
    standaloneAnnouncements(news.items, events.items),
    settings.featuredAnnouncement,
    (post) => post.id,
  );
  return (
    <div className="landing-page">
      <LandingMotion />
      <section className="hero has-moving-molecule">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow light">
              <span className="small-line" />
              SMU Chemistry Graduate Council
            </p>
            <h1>
              Welcome to your
              <br />
              <em>chemistry community.</em>
            </h1>
            <p className="hero-description">
              SMU’s Chemistry Graduate Council connects graduate students
              through professional development, social events, and outreach.
            </p>
            <p className="hero-welcome">
              Whether you’re starting your graduate journey, returning to
              campus, or visiting, we’re glad you’re here.
            </p>
            <div className="hero-actions">
              <ButtonLink href="/events">Upcoming events</ButtonLink>
              <ButtonLink href="/executive-committee" secondary>
                Meet the council
              </ButtonLink>
              <ButtonLink href="/about" secondary>
                About us
              </ButtonLink>
            </div>
          </div>
          <div className="hero-art">
            <AnimatedMolecule />
          </div>
        </div>
      </section>
      <div className="quick-strip">
        <div className="container quick-grid">
          <span className="quick-label">
            Your graduate life,
            <br />
            <strong>connected.</strong>
          </span>
          <Link href="/executive-committee">
            Meet our people <Arrow />
          </Link>
          <Link href="/resources/funding">
            Explore funding <Arrow />
          </Link>
          <Link href="/resources">
            Find student resources <Arrow />
          </Link>
        </div>
      </div>
      <section className="section section-tinted">
        <div className="container">
          <SectionHeading
            label="On the calendar"
            title="Your next connection."
            href="/events"
            linkText="All events"
          />
          {upcoming.length ? (
            <div className="event-list">
              {upcoming.slice(0, 3).map((event) => (
                <EventCard
                  key={`${event.title}-${event.start}`}
                  event={event}
                  featured={eventSlug(event) === settings.featuredEvent}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="The next gathering starts here."
              href={`${site.wordpress}/upcoming-cgc-events/`}
              linkText="Check the council calendar"
            >
              {events.unavailable
                ? "The calendar is temporarily unavailable. Check back soon."
                : "No upcoming events are currently listed here. Check the council calendar for meetings, seminars, and social activities."}
            </EmptyState>
          )}
        </div>
      </section>
      <section className="section container mission-section">
        <div>
          <p className="eyebrow">More than the lab</p>
          <h2>
            Doing science.
            <br />
            Building belonging.
          </h2>
        </div>
        <div className="mission-copy">
          <p className="large-copy">
            Graduate school is a shared experience. We’re here to help make it a
            better one.
          </p>
          <p>
            The Chemistry Graduate Council brings together professional
            development and community life, connecting students through shared
            activities, resources, and opportunities to get involved.
          </p>
          <Link href="/about" className="text-link">
            Discover what we do <Arrow />
          </Link>
        </div>
      </section>
      <section className="section container">
        <SectionHeading
          label="Council updates"
          title="From our community."
          href="/news"
          linkText="All announcements"
        />
        <p className="section-note">
          {news.source === "fallback"
            ? "Selected announcements from the council archive."
            : "The latest news from the council."}
        </p>
        <div className="news-grid">
          {posts.slice(0, 3).map((post) => (
            <NewsCard
              key={post.id}
              post={post}
              featured={post.id === settings.featuredAnnouncement}
            />
          ))}
        </div>
        {news.items.length === 0 && (
          <EmptyState title="Room for the next update.">
            Council announcements will appear here when published.
          </EmptyState>
        )}
      </section>
      <section className="resource-feature">
        <div className="container resource-feature-grid">
          <div>
            <p className="eyebrow light">A little support goes a long way</p>
            <h2>
              Resources for the
              <br />
              <em>road ahead.</em>
            </h2>
            <p>
              From conference funding to everyday essentials, find a starting
              point for the support you need.
            </p>
            <ButtonLink href="/resources">Explore student resources</ButtonLink>
          </div>
          <div className="resource-links">
            <Link href="/resources/funding">
              <span>
                <small>01 / Professional growth</small>Funding & travel
              </span>
              <Arrow />
            </Link>
            <Link href="/resources/food-and-housing">
              <span>
                <small>02 / Everyday support</small>Food & housing
              </span>
              <Arrow />
            </Link>
            <Link href="/resources/speaker-sessions">
              <span>
                <small>03 / Share your science</small>Graduate speaker sessions
              </span>
              <Arrow />
            </Link>
          </div>
        </div>
      </section>
      <section className="container closing-section">
        <div>
          <p className="eyebrow">There’s a place for you here</p>
          <h2>
            Bring your ideas.
            <br />
            We’ll bring the community.
          </h2>
        </div>
        <ButtonLink href="/contact">Get in touch</ButtonLink>
      </section>
    </div>
  );
}
