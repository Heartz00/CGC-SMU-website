import { OfficerCard } from "./content";
import { facultyPositions } from "@/lib/content/faculty";
import type { Officer } from "@/lib/content/types";
export function FacultyLeadership({
  people,
  unavailable = false,
}: {
  people: Officer[];
  unavailable?: boolean;
}) {
  return (
    <section
      id="faculty-leadership"
      className="section faculty-leadership"
      aria-labelledby="faculty-leadership-title"
    >
      <div className="container">
        <p className="eyebrow">Guidance & support</p>
        <h2 id="faculty-leadership-title">Faculty leadership</h2>
        <p className="faculty-lead">
          Meet the faculty supporting our council and chemistry graduate
          community.
        </p>
        <div className="faculty-grid">
          {facultyPositions.map(({ key, role }) => {
            const person = people.find((item) => item.role === role);
            return person ? (
              <OfficerCard
                key={key}
                officer={person}
                headingLevel="h3"
                contactLabel="Email"
              />
            ) : (
              <article key={key} className="faculty-placeholder">
                <h3>{role}</h3>
                <p>
                  {unavailable
                    ? "Profile temporarily unavailable."
                    : "Profile coming soon."}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
