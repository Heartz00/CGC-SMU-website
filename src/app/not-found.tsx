import { ButtonLink, PageIntro } from "@/components/ui";
export default function NotFound() {
  return (
    <>
      <PageIntro label="404 / Page not found" title="Let’s find your way back.">
        <p>
          This page couldn’t be found. Explore the council’s home page for
          events, news, and student resources.
        </p>
      </PageIntro>
      <div className="container section">
        <ButtonLink href="/">Back to the council</ButtonLink>
      </div>
    </>
  );
}
