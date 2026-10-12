"use client";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
function publicUrl(url: string) {
  const u = new URL(url, "https://cgc-smu-websites.vercel.app");
  if (u.pathname === "/admin" || u.pathname.startsWith("/admin/")) return null;
  u.search = "";
  u.hash = "";
  return u.href;
}
export function PublicMetrics() {
  const path = usePathname();
  if (
    process.env.NEXT_PUBLIC_SITE_METRICS_ENABLED !== "true" ||
    path === "/admin" ||
    path.startsWith("/admin/")
  )
    return null;
  return (
    <Suspense fallback={null}>
      <Analytics
        beforeSend={(event) => {
          const url = publicUrl(event.url);
          return url ? { ...event, url } : null;
        }}
      />
      <SpeedInsights
        beforeSend={(event) => {
          const url = publicUrl(event.url);
          return url ? { ...event, url } : null;
        }}
      />
    </Suspense>
  );
}
