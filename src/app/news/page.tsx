import type { Metadata } from "next";
import { getAnnouncements } from "@/lib/content";
import { NewsCard } from "@/components/content";
import { EmptyState, PageIntro } from "@/components/ui";
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
          <div className="news-grid">
            {news.items.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState title="No announcements yet.">
            Published council updates will appear here.
          </EmptyState>
        )}
      </section>
    </>
  );
}
