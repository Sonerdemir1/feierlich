// Geteilt zwischen der echten Gaeste-Seite (e/[slug]/page.tsx) und dem
// Dashboard-Editor (DesignEditor.tsx/ReorderableSection.tsx, Inline Ein-/
// Ausblenden + Umsortieren direkt am Element) — vorher stand dieselbe Liste
// nur als lokale Konstante in page.tsx, DesignEditor.tsx haette sie sonst
// erneut abschreiben muessen (Gefahr des Auseinanderlaufens).
//
// LEGACY_SECTION_ORDER ist die bisherige, fest kodierte Reihenfolge dieser
// Seite (unveraendert fuer alle BESTEHENDEN Events ohne sectionOrder im
// styleJson) — bewusst NICHT identisch mit DesignStudio.tsx' eigenem
// DEFAULT_SECTION_ORDER (dort z.B. rsvp/seating/gallery vor agenda), um das
// Aussehen jedes bereits bestehenden Events unveraendert zu lassen. Neue, aus
// einem Entwurf entstandene Events erhalten stattdessen die vom Kunden im
// Editor gesehene/gewaehlte Reihenfolge.
//
// "wedding-party" haengt bewusst ganz hinten an — als das Feature gebaut
// wurde, fehlte der Eintrag hier (gefundene Luecke: ohne ihn faellt der
// Schluessel bei sectionOrderIndex() immer auf "ganz hinten" zurueck, was
// zufaellig optisch dasselbe Ergebnis ergibt wie ihn explizit ans Ende zu
// haengen — hier trotzdem ergaenzt, weil ReorderableSection ihn als
// echtes Listenmitglied braucht, um ihn ueberhaupt verschieben zu koennen).
export const LEGACY_SECTION_ORDER = [
  "agenda",
  "rsvp",
  "seating",
  "menu",
  "gallery",
  "guestbook",
  "music-requests",
  "wishlist",
  "wedding-party",
  "dresscode",
  "social-media",
  "audio-invitation",
  "video-invitation",
  "thank-you-card",
];

export function activeSectionOrder(styleSectionOrder: unknown): string[] {
  return Array.isArray(styleSectionOrder) && styleSectionOrder.length > 0 ? (styleSectionOrder as string[]) : LEGACY_SECTION_ORDER;
}

export function sectionOrderIndex(order: string[], key: string): number {
  const idx = order.indexOf(key);
  return 100 + (idx === -1 ? order.length : idx);
}
