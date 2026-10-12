import type { Metadata } from "next";
import { ButtonLink, PageIntro } from "@/components/ui";
import { site } from "@/lib/site";
export const metadata: Metadata = { title: "Contact" };
export default function Contact() {
  return (
    <>
      <PageIntro label="Get in touch" title="Your ideas belong here.">
        <p>
          Have a question, an idea for an activity, or a resource to share?
          Start a conversation with the council.
        </p>
      </PageIntro>
      <section className="section container contact-grid">
        <article className="contact-card">
          <p className="eyebrow">Follow the council</p>
          <h2>Stay connected.</h2>
          <p>Follow our events, announcements, and graduate community.</p>
          {site.social.map((social) => (
            <p key={social.label}>
              <a
                className="text-link"
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.label} ↗
              </a>
            </p>
          ))}
        </article>
        <article className="contact-card">
          <p className="eyebrow">Council questions</p>
          <h2>Connect with an officer.</h2>
          <p>
            Contact the officer whose role fits your question. The directory
            includes published individual contact links.
          </p>
          <ButtonLink href="/executive-committee">
            Meet the executive committee
          </ButtonLink>
          <a className="text-link" href={`${site.wordpress}/officers/`}>
            Officer directory
          </a>
        </article>
        <article className="contact-card">
          <p className="eyebrow">Academic & department questions</p>
          <h2>Find SMU Chemistry.</h2>
          <p>
            For university program information and department contacts, visit
            the Department of Chemistry website.
          </p>
          <ButtonLink href={site.department}>
            Department of Chemistry
          </ButtonLink>
        </article>
      </section>
    </>
  );
}
