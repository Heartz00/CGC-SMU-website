"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigation } from "@/lib/site";
import { NavigationLabel } from "./navigation-label";

export function Navigation() {
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenAt(null);
        button.current?.focus();
      }
    }
    document.addEventListener("keydown", escape);
    const outside = (event: PointerEvent) => {
      if (!(event.target as Element).closest(".site-header")) setOpenAt(null);
    };
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  return (
    <>
      <button
        ref={button}
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="primary-nav"
        onClick={() => setOpenAt(open ? null : pathname)}
      >
        {open ? "Close" : "Menu"}{" "}
        <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>
      <nav
        id="primary-nav"
        aria-label="Main navigation"
        className={open ? "navigation is-open" : "navigation"}
      >
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={
              (
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`)
              )
                ? "page"
                : undefined
            }
            onClick={() => setOpenAt(null)}
          >
            <NavigationLabel label={item.label} />
          </Link>
        ))}
      </nav>
    </>
  );
}
