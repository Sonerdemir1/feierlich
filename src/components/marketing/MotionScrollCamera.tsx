"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// docs/MOTION.md §2 "Kamerafahrten beim Scrollen" — ersetzt RevealAnimator
// (Fade-and-slide-up) auf der Startseite: Abschnitte werden per
// scrub-gebundenem scale(1.08→1)+opacity(0→1) erreicht, "als bewege sich
// die Kamera nach vorn" statt dass sich Inhalt nach oben schiebt.
//
// Bewusst OHNE Lenis: das kuenstliche Ueber-Zeit-Glaetten jedes
// Scroll-Impulses (frueher `duration: 1.2`) machte die ganze Seite spuerbar
// traege ("extrem langsam" laut Nutzer-Feedback) — Scrollen fuehlte sich
// gedaempft statt direkt an. ScrollTrigger braucht Lenis nicht, es
// funktioniert genauso gut mit nativem Scroll — dadurch reagiert die Seite
// wieder 1:1 auf Maus-/Trackpad-Input, die Kamerafahrten bleiben erhalten.
export function MotionScrollCamera() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const sections = gsap.utils.toArray<HTMLElement>(".motion-home .reveal");
    const tweens = sections.map((el) =>
      gsap.fromTo(
        el,
        { autoAlpha: 0, scale: 1.08 },
        {
          autoAlpha: 1,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 88%", end: "top 48%", scrub: 1 },
        }
      )
    );
    // Setzt zusaetzlich einmalig .in (bleibt dauerhaft) — mehrere bestehende
    // Regeln (.reveal.in .feature-points > div, .cat-nav-grid > a, ...)
    // stammen noch aus dem alten RevealAnimator-System und warten auf diese
    // Klasse fuer ihre eigene gestaffelte Kind-Element-Animation. Ohne dies
    // blieben all diese Kind-Elemente permanent unsichtbar (opacity:0),
    // weil niemand mehr .in setzt, seit RevealAnimator ersetzt wurde.
    const inTriggers = sections.map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => el.classList.add("in"),
      })
    );

    return () => {
      tweens.forEach((t) => t.scrollTrigger?.kill());
      inTriggers.forEach((t) => t.kill());
    };
  }, []);

  return null;
}
