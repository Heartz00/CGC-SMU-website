import type { Metadata } from "next";
import Link from "next/link";
import { getCouncilHistory } from "@/lib/content/council-settings";
import { OfficerCard } from "@/components/content";
import { PageIntro, dateLabel } from "@/components/ui";
export const metadata: Metadata = { title: "Council history" };
export const revalidate = 300;
export default async function History() {
  const terms = await getCouncilHistory();
  return (
    <>
      <PageIntro label="Our people" title="The councils before us.">
        <p>Recognizing the students who helped build our community.</p>
      </PageIntro>
      <section className="section container">
        <Link href="/executive-committee" className="text-link">
          Meet the current council →
        </Link>
        {terms.length ? (
          terms.map((term) => (
            <section className="council-term" id={term.id} key={term.id}>
              <h2>{term.label}</h2>
              <p>
                {dateLabel(term.start)} – {dateLabel(term.end)}
              </p>
              <div className="officers-grid">
                {term.officers.map((officer) => (
                  <OfficerCard
                    key={`${officer.name}-${officer.role}`}
                    officer={officer}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <p className="section-note">
            Council history will appear here as terms are archived.
          </p>
        )}
      </section>
    </>
  );
}
