"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { NavigationLabel } from "../navigation-label";
export function AdminNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const active =
    href === "/admin"
      ? pathname === href
      : pathname.startsWith(`${href}/`) || pathname === href;
  return (
    <Link
      href={href}
      prefetch={false}
      onPointerEnter={() => {
        cancel();
        timer.current = setTimeout(() => router.prefetch(href), 150);
      }}
      onPointerLeave={cancel}
      onFocus={() => router.prefetch(href)}
      aria-current={active ? "page" : undefined}
    >
      <NavigationLabel label={label} />
    </Link>
  );
}
