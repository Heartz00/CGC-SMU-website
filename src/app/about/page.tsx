import type { Metadata } from "next";
import { ButtonLink, PageIntro } from "@/components/ui";
import { site } from "@/lib/site";
export const metadata: Metadata = { title: "About" };
export default function About() {
  return (
    <>
      <PageIntro
        label="About the council"
        title="A shared bond. A shared purpose."
      >
        <p>
          Supporting professional growth and bringing more community to
          chemistry graduate life.
        </p>
      </PageIntro>
      <section className="section container two-column">
        <div>
          <p className="eyebrow">Our purpose</p>
          <h2>
            Graduate life is
            <br />
            better together.
          </h2>
        </div>
        <div className="prose">
          <p>
            The Chemistry Graduate Council is an SMU Chemistry Graduate Student
            Association. Its two stated objectives are to further the
            professional development of chemistry graduate students and bring
            more fun to graduate life.
          </p>
          <p>
            Through meetings, speaker sessions, social activities, and outreach,
            the council offers opportunities to connect beyond individual
            research groups.
          </p>
          <p>
            The council serves the graduate student community within SMU’s
            Department of Chemistry. This website presents council information
            and links to university resources.
          </p>
          <a href={site.wordpress}>Explore the council archive</a>
        </div>
      </section>
      <section className="section section-tinted">
        <div className="container">
          <div className="values-grid">
            {[
              {
                title: "Grow as a scientist",
                text: "Practice presentations, exchange ideas, and find resources for your professional development.",
              },
              {
                title: "Connect as a community",
                text: "Meet fellow graduate students through council activities and shared experiences.",
              },
              {
                title: "Make your voice heard",
                text: "Bring questions and ideas to the officers who help organize council activities.",
              },
            ].map((value, i) => (
              <article className="value-card" key={value.title}>
                <span className="number">0{i + 1}</span>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="container closing-section">
        <h2>
          Meet the people
          <br />
          behind the council.
        </h2>
        <ButtonLink href="/executive-committee">Executive committee</ButtonLink>
      </section>
    </>
  );
}
