import type { Metadata } from "next";
import { getAnnouncements } from "@/lib/content";
import { NewsCard } from "@/components/content";
import { EmptyState, PageIntro } from "@/components/ui";
import { CollectionSearch } from "@/components/collection-search";
export const metadata: Metadata = { title: "News & Announcements" };
export const revalidate = 300;
export default async function News() {
  const news = await getAnnouncements();
  return (
    <>
      <PageIntro label="News & announcements" title="Keep up with the council.">
        <p>
          Published updates, community activities, and notes from graduate life.
        </p>
      </PageIntro>
      <section className="section container">
        <p className="section-note">
          {news.source === "fallback"
            ? "Showing selected archive links. Live updates are currently unavailable here."
            : "Updates, activities, and news from the council."}
        </p>
        {news.items.length ? (
          <CollectionSearch
            label="announcements"
            className="news-grid"
            items={news.items.map((post) => ({
              id: String(post.id),
              text: `${post.title} ${post.excerpt}`,
              group: post.date.slice(0, 4),
              content: <NewsCard post={post} />,
            }))}
          />
        ) : (
          <EmptyState title="No announcements yet.">
            Published council updates will appear here.
          </EmptyState>
        )}
      </section>
    </>
  );
}
