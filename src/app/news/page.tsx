import type { Metadata } from "next";
import { getAnnouncements, getEvents } from "@/lib/content";
import { standaloneAnnouncements } from "@/lib/content/announcement-events";
import Link from "next/link";
import { NewsCard } from "@/components/content";
import { EmptyState, PageIntro } from "@/components/ui";
import { CollectionSearch } from "@/components/collection-search";
export const metadata: Metadata = { title: "Announcements" };
export const revalidate = 300;
export default async function News() {
  const [news, events] = await Promise.all([getAnnouncements(), getEvents()]);
  const posts = standaloneAnnouncements(news.items, events.items);
  return (
    <>
      <PageIntro label="News & announcements" title="Keep up with the council.">
        <p>
          Council news, opportunities, and community updates. Find dated
          activities in <Link href="/events">Events</Link>.
        </p>
      </PageIntro>
      <section className="section container">
        <p className="section-note">
          {news.source === "fallback"
            ? "Showing selected archive links. Live updates are currently unavailable here."
            : "Updates, activities, and news from the council."}
        </p>
        {posts.length ? (
          <CollectionSearch
            label="announcements"
            className="news-grid"
            items={posts.map((post) => ({
              id: String(post.id),
              text: `${post.title} ${post.excerpt}`,
              group: post.date.slice(0, 4),
              content: <NewsCard post={post} />,
            }))}
          />
        ) : (
          <EmptyState title="No announcements yet.">
            General council updates will appear here. Scheduled activities are
            listed in <Link href="/events">Events</Link>.
          </EmptyState>
        )}
      </section>
    </>
  );
}
