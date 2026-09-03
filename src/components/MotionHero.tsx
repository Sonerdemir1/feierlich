"use client";

import { useEffect, useRef, useState } from "react";

// Der einzige grosse Motion-Moment der Seite (docs/MOTION.md §2). Phasen als
// CSS-Keyframes/-Transitions mit den dort exakt vorgegebenen Zeiten und
// cubic-bezier-Kurven, ausgeloest ueber einen einzigen data-phase-Wechsel —
// robuster als eine JS-Timeline mit vielen setTimeout()-Aufrufen, und jede
// Kurve ist so exakt wie in der Spezifikation angegeben (CSS kennt
// cubic-bezier() nativ, keine Approximation ueber benannte Eases noetig).
export function MotionHero({ names }: { names: string }) {
  const [phase, setPhase] = useState<"idle" | "opening" | "open">("idle");
  const ornamentRef = useRef<SVGPathElement>(null);
  const ornamentRef2 = useRef<SVGPathElement>(null);

  // Reduced-Motion: kein Umschlag-Interaktionsschritt, die Karte ist sofort
  // offen und voll nutzbar (§5 — "nicht nur 'auch gehen'"). Als Subscription
  // statt einmaligem Check, damit eine waehrend des Besuchs geaenderte
  // OS-Einstellung ebenfalls sofort greift.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncFromSystem = () => {
      if (mq.matches) setPhase("open");
    };
    syncFromSystem();
    mq.addEventListener("change", syncFromSystem);
    return () => mq.removeEventListener("change", syncFromSystem);
  }, []);

  // Pfadlaenge zur Laufzeit messen statt zu raten — robuster als ein fest
  // codierter stroke-dasharray-Wert, falls sich der Pfad je aendert.
  useEffect(() => {
    for (const ref of [ornamentRef, ornamentRef2]) {
      const el = ref.current;
      if (!el) continue;
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
    }
  }, []);

  useEffect(() => {
    if (phase === "idle") return;
    for (const ref of [ornamentRef, ornamentRef2]) {
      ref.current?.style.setProperty("stroke-dashoffset", "0");
    }
  }, [phase]);

  function open() {
    if (phase !== "idle") return;
    setPhase("opening");
    window.setTimeout(() => setPhase("open"), 2900);
  }

  const letters = names.split("");

  return (
    <section className="motion-hero" data-phase={phase}>
      <div className="motion-hero-vignette" aria-hidden="true" />
      <div className="motion-hero-scene">
        {/* Landschaft-Umschlag (echte Proportionen 3:2) mit Dreiecks-Klappe
            per clip-path — gleiche bewaehrte Technik wie EnvelopeOpen.tsx
            fuer die echten Einladungsseiten, nur mit den in MOTION.md §2
            vorgegebenen Timings/Kurven statt der dortigen. */}
        <div className="motion-envelope">
          <div className="motion-envelope-body" />
          <div className="motion-flap" />
          <button
            type="button"
            className="motion-seal"
            onClick={open}
            aria-label="Einladung öffnen"
            disabled={phase !== "idle"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 21s-7.5-4.6-10-9.3C.3 7.9 2 4 6 4c2.4 0 3.8 1.3 6 4 2.2-2.7 3.6-4 6-4 4 0 5.7 3.9 4 7.7C19.5 16.4 12 21 12 21z"
                fill="var(--ink)"
              />
            </svg>
          </button>
        </div>

        {/* Hochformat-Karte (5:7, wie die restlichen Kartendesigns der Seite)
            — gleitet aus dem Umschlag nach oben heraus statt dessen eigene
            Landschafts-Proportion zu teilen. */}
        <div className="motion-card">
          <div className="motion-card-inner">
            <svg className="motion-ornament" viewBox="0 0 240 40" aria-hidden="true">
              <path ref={ornamentRef} d="M4 20 C40 4, 80 4, 120 20" fill="none" stroke="var(--gold)" strokeWidth="1" />
              <path
                ref={ornamentRef2}
                d="M120 20 C160 36, 200 36, 236 20"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="1"
              />
            </svg>
            <div className="motion-card-names">
              {letters.map((ch, i) => (
                <span key={i} className="motion-card-letter" style={{ "--i": i } as React.CSSProperties}>
                  {ch === " " ? " " : ch}
                </span>
              ))}
            </div>
            <div className="motion-card-date">20. Juni 2026</div>
          </div>
        </div>
      </div>

      {phase === "idle" && (
        <div className="motion-hero-hint" aria-hidden="true">
          Antippen zum Öffnen
        </div>
      )}
    </section>
  );
}
