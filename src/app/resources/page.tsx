import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, PageIntro } from "@/components/ui";
import { resources } from "@/lib/resources";
export const metadata: Metadata = { title: "Student Resources" };
export default function Resources() {
  return (
    <>
      <PageIntro label="Student resources" title="Support for the road ahead.">
        <p>
          Useful starting points for your research, professional growth, and
          everyday graduate life.
        </p>
      </PageIntro>
      <section className="section container">
        <div className="resources-grid">
          {resources.map((resource) => (
            <Link
              className="resource-card"
              key={resource.slug}
              href={`/resources/${resource.slug}`}
            >
              <div className="resource-card-top">
                <span className="number">{resource.number}</span>
                <Arrow />
              </div>
              <p className="eyebrow">{resource.category}</p>
              <h2>{resource.title}</h2>
              <p>{resource.description}</p>
              <span className="text-link">Explore resources →</span>
            </Link>
          ))}
        </div>
        <p className="section-note resource-note">
          Check the linked university sources for current eligibility,
          deadlines, and procedures.
        </p>
      </section>
    </>
  );
}
