import type { Metadata } from "next";
import { getOfficers } from "@/lib/content";
import { OfficerCard } from "@/components/content";
import { EmptyState, PageIntro } from "@/components/ui";
import { site } from "@/lib/site";
import Link from "next/link";
export const metadata: Metadata = { title: "Executive Committee" };
export const revalidate = 300;
export default async function Committee() {
  const officers = await getOfficers();
  return (
    <>
      <PageIntro label="Our people" title="Meet your council.">
        <p>
          Student leaders who help connect our graduate community, organize
          activities, and turn ideas into action.
        </p>
      </PageIntro>
      <section className="section container">
        <p>
          <Link className="text-link" href="/executive-committee/history">
            Explore council history →
          </Link>
        </p>
        {officers.items.length ? (
          <div className="officers-grid">
            {officers.items.map((officer) => (
              <OfficerCard
                key={`${officer.name}-${officer.role}`}
                officer={officer}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Meet the council."
            href={`${site.wordpress}/officers/`}
            linkText="Open the officer directory"
          >
            {officers.unavailable
              ? "The directory is temporarily unavailable. Check back soon."
              : "Council details will be available soon."}
          </EmptyState>
        )}
      </section>
    </>
  );
}
