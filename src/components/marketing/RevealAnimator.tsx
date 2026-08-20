"use client";

import { useEffect } from "react";

// Faded scroll-in for elements marked with the `.reveal` class. No-op
// (renders nothing) — it just attaches the observer once on mount.
export function RevealAnimator() {
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
