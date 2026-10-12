"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
export function AdminNavigationMenu({
  children,
  items,
}: {
  children: ReactNode;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const active = items.find(
    (item) =>
      item.href === pathname ||
      (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)),
  );
  return (
    <>
      <div className="admin-nav-desktop">{children}</div>
      <details
        className="admin-nav-mobile"
        key={pathname}
        onClick={(event) => {
          if ((event.target as Element).closest("a"))
            event.currentTarget.open = false;
        }}
      >
        <summary>Navigate · {active?.label || "Dashboard"}</summary>
        {children}
      </details>
    </>
  );
}
