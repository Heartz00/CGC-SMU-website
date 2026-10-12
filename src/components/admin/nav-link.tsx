"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function AdminNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active =
    href === "/admin"
      ? pathname === href
      : pathname.startsWith(`${href}/`) || pathname === href;
  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
