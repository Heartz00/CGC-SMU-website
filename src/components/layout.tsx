import Link from "next/link";
import Image from "next/image";
import { Navigation } from "./navigation";
import { site } from "@/lib/site";

export function Header() {
  return (
    <>
      <div className="affiliation">
        <div className="container affiliation-inner">
          <a className="smu-brand" href="https://www.smu.edu/">
            <Image
              src="/brand/smu-logo.png"
              alt="SMU — World Changers Shaped Here"
              width={662}
              height={120}
              className="smu-logo"
              priority
            />
          </a>
          <a className="department-link" href={site.department}>
            Department of Chemistry <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Link
            className="brand"
            href="/"
            aria-label="Chemistry Graduate Council home"
          >
            <Image
              src="/brand/cgc-logo.png"
              alt="Chemistry Graduate Council, SMU"
              width={975}
              height={320}
              className="cgc-logo"
              priority
            />
          </Link>
          <Navigation />
        </div>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="footer-title">
            <Image
              src="/brand/cgc-logo.png"
              alt="Chemistry Graduate Council, SMU"
              width={975}
              height={320}
              className="cgc-logo footer-cgc-logo"
            />
          </Link>
          <p>
            Graduate life. Shared.
            <br />
            Southern Methodist University · Dallas, Texas
          </p>
        </div>
        <div>
          <h2>The council</h2>
          <Link href="/about">About us</Link>
          <Link href="/executive-committee">Executive committee</Link>
          <Link href="/contact">Get in touch</Link>
          <Link href="/admin">Council sign-in</Link>
        </div>
        <div>
          <h2>Stay connected</h2>
          {site.social.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {social.label} ↗
            </a>
          ))}
          <Link href="/events">Events & meetings</Link>
          <Link href="/resources">Student resources</Link>
          <a href={site.wordpress}>Council archive</a>
        </div>
        <div>
          <h2>At SMU</h2>
          <a href={site.department}>Department of Chemistry ↗</a>
          <a href="https://www.smu.edu/moody">Moody School ↗</a>
          <a href="https://www.smu.edu/">SMU ↗</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>A student council website affiliated with SMU Chemistry.</span>
        <a className="smu-brand footer-smu-brand" href="https://www.smu.edu/">
          <Image
            src="/brand/smu-logo.png"
            alt="SMU — World Changers Shaped Here"
            width={662}
            height={120}
            className="smu-logo"
          />
        </a>
      </div>
    </footer>
  );
}
