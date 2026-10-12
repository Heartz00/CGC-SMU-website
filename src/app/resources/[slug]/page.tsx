import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getWordPressPage } from "@/lib/content/wordpress";
import { cleanHtml } from "@/lib/content/adapters";
import { resources } from "@/lib/resources";
import { site } from "@/lib/site";
import { ButtonLink, PageIntro } from "@/components/ui";
export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return resources.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: resources.find((item) => item.slug === slug)?.title || "Resources",
  };
}
export default async function Resource({ params }: Props) {
  const { slug } = await params;
  const resource = resources.find((item) => item.slug === slug);
  if (!resource) notFound();
  let html: string | null = null;
  try {
    html = await getWordPressPage(resource.wordpressSlug);
  } catch {
    /* The source link remains usable during an API outage. */
  }
  return (
    <>
      <PageIntro label={resource.category} title={resource.title}>
        <p>{resource.description}</p>
      </PageIntro>
      <section className="section container article">
        <Link href="/resources" className="text-link">
          ← All resources
        </Link>
        <p className="section-note resource-note">
          Published council information may include older forms, contacts, or
          funding rules. Confirm current details with the university source
          before applying.
        </p>
        {html && (
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: cleanHtml(html) }}
          />
        )}
        <ButtonLink href={`${site.wordpress}/${resource.wordpressSlug}/`}>
          Open resource
        </ButtonLink>
      </section>
    </>
  );
}
