"use client";
import { useEffect } from "react";
export function LandingMotion() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !("IntersectionObserver" in window)) return;
    const elements = [
      ...document.querySelectorAll<HTMLElement>(
        ".landing-page > .section .section-heading, .landing-page > .section .event-card, .landing-page > .section .news-card, .landing-page .quick-grid",
      ),
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.08 },
    );
    const reset = () => {
      for (const element of elements) {
        element.classList.remove("motion-reveal");
        element.classList.remove("is-revealed");
      }
    };
    for (const element of elements) {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add("motion-reveal");
        observer.observe(element);
      }
    }
    reduced.addEventListener("change", reset);
    return () => {
      observer.disconnect();
      reset();
      reduced.removeEventListener("change", reset);
    };
  }, []);
  return null;
}
