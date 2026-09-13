// Scroll-Reveal-Muster fuer die "Editoriale Erlebniswelt"-Marketingseiten,
// siehe docs/MOTION.md §2. amount:0.05 statt der frueheren 0.2 — bei sehr
// grossen Elementen (z.B. die Vergleichstabelle) soll die Animation schon
// auslösen, sobald ein kleiner Teil sichtbar ist, nicht erst bei 20%.
export const ZERA_EASE = [0.16, 1, 0.3, 1] as const;

export function mountReveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: ZERA_EASE } },
  };
}

export function scrollReveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: ZERA_EASE } },
    viewport: { once: true, amount: 0.05 },
  };
}
