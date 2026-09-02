"use client";

import { useEffect } from "react";

// Faded scroll-in fuer Elemente mit der `.reveal`-Klasse. No-op (rendert
// nichts) — haengt beim Mount nur den Sichtbarkeits-Check an.
export function RevealAnimator() {
  useEffect(() => {
    let pending = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (pending.length === 0) return;

    const check = () => {
      const threshold = window.innerHeight * 1.1;
      // rect.top < threshold erfasst sowohl "kommt gerade von unten rein"
      // als auch "ein grosser Scroll-Sprung (Anker-Klick auf #preise o.ae.)
      // ist bereits darueber hinweggegangen". Ein reiner IntersectionObserver
      // verpasst den zweiten Fall: bei einem Sprung entsteht nie ein
      // Zwischenzustand mit tatsaechlicher Ueberschneidung, das Element
      // bliebe sonst dauerhaft bei opacity:0 haengen (live getestet).
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < threshold) {
          el.classList.add("in");
          return false;
        }
        return true;
      });
      if (pending.length === 0) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        check();
        ticking = false;
      });
    };

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
