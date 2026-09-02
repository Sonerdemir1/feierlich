// Text-Sicherheitszone je "Blanko"-Kartendesign (Template.previewUrl,
// siehe public/images/templates/dugun-blanko/). Prozentualer Inset
// (oben/rechts/unten/links) relativ zur Bildgroesse — per Bildanalyse
// ermittelt (Rand-/Ornament-Erkennung je Karte, nicht geschaetzt), damit
// der eingeblendete Text (Namen, Datum) nie die gedruckten
// Blumen/Goldlinien ueberlappt. Neue Kartendesigns brauchen einen neuen
// Eintrag hier — ohne Eintrag greift FALLBACK_TEXT_ZONE.
export const CARD_TEXT_ZONE: Record<string, { top: number; right: number; bottom: number; left: number }> = {
  "dugun-01": { top: 22, right: 18, bottom: 18, left: 17 },
  "dugun-02": { top: 20, right: 21, bottom: 17, left: 21 },
  "dugun-04": { top: 22, right: 24, bottom: 21, left: 23 },
  "dugun-05": { top: 28, right: 23, bottom: 25, left: 23 },
  "dugun-06": { top: 20, right: 22, bottom: 18, left: 22 },
  "dugun-07": { top: 23, right: 26, bottom: 20, left: 28 },
  "dugun-08": { top: 22, right: 27, bottom: 19, left: 26 },
  "dugun-09": { top: 23, right: 25, bottom: 17, left: 25 },
  "dugun-11": { top: 22, right: 22, bottom: 13, left: 21 },
  "dugun-12": { top: 10, right: 16, bottom: 10, left: 12 },
  "dugun-14": { top: 12, right: 24, bottom: 18, left: 9 },
  "dugun-15": { top: 20, right: 31, bottom: 30, left: 19 },
};

export const FALLBACK_TEXT_ZONE = { top: 26, right: 15, bottom: 26, left: 15 };

export function cardTextZone(layoutKey: string) {
  return CARD_TEXT_ZONE[layoutKey] ?? FALLBACK_TEXT_ZONE;
}
