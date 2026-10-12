"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigation } from "@/lib/site";

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  return (
    <>
      <button
        ref={button}
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="primary-nav"
        onClick={() => setOpen(!open)}
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
            aria-current={pathname.startsWith(item.href) ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
