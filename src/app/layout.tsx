import type { Metadata } from "next";
import { PublicMetrics } from "@/components/public-metrics";
import { Header, Footer } from "@/components/layout";
import { site } from "@/lib/site";
import "./globals.css";
import "./modern.css";

export const metadata: Metadata = {
  ...(process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? {
        metadataBase: new URL(
          process.env.SITE_URL ||
            `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
        ),
      }
    : {}),
  title: {
    default: "Chemistry Graduate Council | SMU",
    template: "%s | SMU Chemistry Graduate Council",
  },
  description: site.description,
  openGraph: {
    title: "Chemistry Graduate Council | SMU",
    description: site.description,
    type: "website",
    locale: "en_US",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <PublicMetrics />
      </body>
    </html>
  );
}
