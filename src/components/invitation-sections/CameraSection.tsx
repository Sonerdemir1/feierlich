"use client";

import { useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

// Liefert false beim SSR/ersten Client-Rendering (identisch, kein Hydration-
// Mismatch), erst danach true — Standardmuster fuer "nur nach dem Mount"
// ohne setState im Effect (react-hooks/set-state-in-effect).
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// Scroll-gekoppelte Kamerafahrt (scale 1.08→1 + opacity 0→1), identische
// Technik wie useCameraProgress()/CameraChapterShell in HomeChapters.tsx
// (docs/MOTION.md §2) — jetzt auch fuer die Gestalten-Vorschau gueltig
// (Nutzer-Entscheidung: Konsistenz mit dem "Cinematic Scroll"-Homepage-
// Gefuehl wichtiger als die bisherige Trennung, siehe MOTION.md-Anpassung).
// Anders als dort: respektiert prefers-reduced-motion (dort noch nicht
// umgesetzt, siehe Bericht) — hier bewusst korrekt, MOTION.md §5 ist
// verbindlich.
export function CameraSection({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  // `prefersReducedMotion` ist serverseitig unbekannt (kein window/matchMedia
  // beim SSR) — wuerde man ihn direkt fuers Weglassen von scale/opacity
  // nutzen, weicht das allererste Client-Rendering vom SSR-Output ab
  // (React-Hydration-Mismatch, live mit Playwright + emulateMedia
  // "reduced-motion" nachgewiesen). Deshalb: erste Client-Runde identisch
  // zum Server rendern (scale/opacity wie gehabt), erst NACH dem Mount auf
  // die reduzierte Fassung umschalten, falls gewuenscht.
  const mounted = useMounted();
  const skipMotion = mounted && prefersReducedMotion;
  // WICHTIG: `style` bekommt IMMER dieselbe Form (scale/opacity als
  // MotionValues) — nie zwischen "motion-gesteuert" und "normalem style"
  // hin- und herwechseln. Live mit Playwright + emulateMedia nachgewiesen:
  // wechselt man die Form (z.B. style={skipMotion ? style : {...style,
  // scale, opacity}}), bleibt Motion beim Wechsel bei einem alten,
  // eingefrorenen opacity-Wert haengen statt sauber auf 1 zurueckzusetzen —
  // ein Aufraeum-Bug beim Prop-Typwechsel. Stattdessen bleiben scale/opacity
  // immer MotionValues, nur ihr Wertebereich kollabiert bei reduzierter
  // Bewegung auf eine Konstante (1/1).
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const scale = useTransform(scrollYProgress, [0, 1], skipMotion ? [1, 1] : [1.08, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], skipMotion ? [1, 1] : [0, 1]);

  return (
    <motion.div ref={ref} className={className} style={{ ...style, scale, opacity }}>
      {children}
    </motion.div>
  );
}
