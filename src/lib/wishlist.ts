export type WishlistItemType = "GIFT" | "CASH" | "HONEYMOON" | "EXTERNAL";

export const WISHLIST_TYPES: WishlistItemType[] = ["GIFT", "CASH", "HONEYMOON", "EXTERNAL"];

// Zentrale Stelle statt der bisher zwei unabhaengigen Kopien in
// e/[slug]/page.tsx und dashboard/events/[id]/page.tsx (gleiche Lehre wie
// TEXT_ELEMENT_KEYS aus Schritt 3 — zwei Kopien laufen frueher oder spaeter
// auseinander).
export const WISHLIST_TYPE_LABEL: Record<WishlistItemType, string> = {
  GIFT: "Geschenke",
  CASH: "Geldgeschenke",
  HONEYMOON: "Flitterwochen",
  EXTERNAL: "Weitere Wünsche",
};

// Reine Anzeige-/Editierdaten (kein eigener Stil pro Artikel wie beim
// Ablaufplan-Eintrag — ein Wunschartikel ist reiner Inhalt: Typ, Titel,
// Beschreibung, Link, siehe Schritt 4 Anforderungen).
export type WishlistItemData = {
  id: string;
  type: WishlistItemType;
  title: string;
  description: string;
  url: string;
};

// Bewusst FESTE ids statt crypto.randomUUID(): DesignStudio.tsx berechnet
// `draft` bei JEDEM Render neu ueber mergedDraft() -> defaultDraft() (nicht
// gememoized), solange noch kein einziges Feld bearbeitet wurde. Zufaellige
// ids wuerden sich dadurch bei jedem Re-Render aendern und selectedWishlistId
// (Vergleich per `.find(it => it.id === selectedWishlistId)`, siehe
// DesignStudio.tsx) sofort wieder entkoppeln — ein Klick auf einen der drei
// Standard-Artikel wuerde sich augenblicklich selbst wieder abwaehlen. Die
// festen ids sind fuer den Kunden nie sichtbar (nur intern fuer React-
// keys/Vergleiche) und werden beim Konvertieren in ein echtes Event ohnehin
// verworfen (siehe apply-draft/route.ts, sanitizeWishlistItems() — dort
// entsteht immer eine frische crypto.randomUUID(), weil WishlistItem.id
// anders als hier global ueber ALLE Events eindeutig sein muss).
export function defaultWishlistItems(): WishlistItemData[] {
  return [
    { id: "wishlist-1", type: "GIFT", title: "Geschirr-Set", description: "", url: "" },
    { id: "wishlist-2", type: "HONEYMOON", title: "Reisegutschein", description: "", url: "" },
    { id: "wishlist-3", type: "GIFT", title: "Küchenmaschine", description: "", url: "" },
  ];
}

export function newWishlistItem(): WishlistItemData {
  return { id: crypto.randomUUID(), type: "GIFT", title: "Neuer Wunsch", description: "", url: "" };
}

// Vertauscht mit dem naechsten Nachbarn DESSELBEN Typs (nicht dem naechsten
// Element im Gesamt-Array) — die Anzeige gruppiert Artikel nach Typ (siehe
// e/[slug]/page.tsx), "hoch/runter" soll sich also innerhalb der sichtbaren
// Gruppe bewegen, nicht ueberraschend in eine andere Gruppe springen.
export function moveWishlistItem(items: WishlistItemData[], id: string, direction: "up" | "down"): WishlistItemData[] {
  const item = items.find((it) => it.id === id);
  if (!item) return items;
  const sameTypeIndices = items.reduce<number[]>((acc, it, i) => {
    if (it.type === item.type) acc.push(i);
    return acc;
  }, []);
  const idx = items.indexOf(item);
  const pos = sameTypeIndices.indexOf(idx);
  const swapWithIdx = direction === "up" ? sameTypeIndices[pos - 1] : sameTypeIndices[pos + 1];
  if (swapWithIdx === undefined) return items;
  const next = [...items];
  [next[idx], next[swapWithIdx]] = [next[swapWithIdx], next[idx]];
  return next;
}
