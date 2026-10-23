import type { Metadata } from "next";
import "./forum.css";
export const metadata: Metadata = {
  title: "Student community",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="forum-page">{children}</div>;
}
