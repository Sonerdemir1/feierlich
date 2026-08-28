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
      // threshold statt eines Bruchteils: bei sehr hohen Sections (z.B. die
      // Vorlagen-Galerie im gestapelten Mobil-Layout, oft > 9000px) waere
      // ein Anteils-Schwellwert wie 0.1 auf schmalen/kurzen Viewports nie
      // erreichbar (Viewport-Hoehe < 10% der Element-Hoehe) — die Section
      // bliebe dauerhaft unsichtbar. rootMargin sorgt stattdessen dafuer,
      // dass die Animation kurz bevor das Element den Viewport erreicht
      // auslöst, unabhaengig von dessen Gesamthoehe.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
