import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { enabled, getWordPressPost } from "@/lib/content/wordpress";
import { dateLabel } from "@/components/ui";
import { Flyer } from "@/components/flyer";
export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };
async function postFor(props: Props) {
  const { slug } = await props.params;
  if (!enabled()) return null;
  return getWordPressPost(slug);
}
export async function generateMetadata(props: Props): Promise<Metadata> {
  const post = await postFor(props);
  return { title: post?.title || "Announcement", description: post?.excerpt };
}
export default async function Post(props: Props) {
  const post = await postFor(props);
  if (!post) notFound();
  return (
    <article className="section container article">
      <Link href="/news" className="text-link">
        ← All announcements
      </Link>
      <p className="eyebrow article-date">
        <time dateTime={post.date}>{dateLabel(post.date)}</time>
      </p>
      <h1>{post.title}</h1>

      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: post.html || "" }}
      />
      {post.registration && (
        <p>
          <a className="button" href={post.registration}>
            Registration & details ↗
          </a>
        </p>
      )}
      {post.flyer && (
        <Flyer src={post.flyer} alt={post.flyerAlt || `${post.title} flyer`} />
      )}
      <a className="text-link" href={post.url}>
        View in the archive
      </a>
    </article>
  );
}
