import type { TextElementStyle } from "./text-style";

// Geteiltes Datenmodell fuer den Ablaufplan — genutzt vom anonymen
// Marketing-Customizer (DesignStudio.tsx, localStorage) UND vom echten
// Event (Event.agendaJson, siehe agenda/route.ts), damit beide Seiten
// exakt dieselbe Struktur und denselben Umgang mit Hinzufuegen/Entfernen/
// Umsortieren teilen.
export type AgendaItem = {
  id: string;
  time: string;
  label: string;
  // Pro-Eintrag Stil (Groesse/Ausrichtung/Farbe/Stil/Schriftart) — bewusst
  // NICHT im globalen StyleElements-Bag (dort gibt es nur einen Eintrag pro
  // TextElementKey, der Ablaufplan hat aber beliebig viele Zeilen).
  style?: TextElementStyle;
};

// Reine Beispielinhalte fuer den anonymen Customizer (siehe Umsetzungsplan
// Phase M5) — auf einer echten, bezahlten Event-Seite werden Gaeste nie mit
// erfundenen Programmpunkten konfrontiert, deshalb startet ein echtes
// Event stattdessen mit einer leeren Liste (siehe e/[slug]/page.tsx).
//
// Die festen ids ("agenda-1" usw.) sehen aus wie der Wunschlisten-Bug, der
// nach Schritt 6 in apply-draft/route.ts gefixt wurde (siehe Kommentar dort
// und in wishlist.ts) — sind hier aber bewusst UNVERAENDERT gelassen und
// KEIN Bug: Event.agendaJson ist ein reiner JSON-String pro Event (siehe
// schema.prisma), keine eigene Tabelle mit globalem eindeutigen id-Feld wie
// WishlistItem. Zwei verschiedene Events koennen also beide unangetastet
// "agenda-1"/"agenda-2"/"agenda-3" enthalten, ohne dass es je zu einer
// Datenbank-Kollision kommen kann — anders als bei WishlistItem.id gibt es
// hier schlicht keine Instanz, mit der kollidiert werden koennte. (Separat
// aufgefallen, aber nicht Teil dieses Fixes: apply-draft uebernimmt diese
// Beispielinhalte tatsaechlich unveraendert in ein neu erzeugtes Event,
// wenn der Ablaufplan nie bearbeitet wurde — im Widerspruch zum Kommentar
// oben, der eine leere Liste erwartet. Reine Produktentscheidung, keine
// technische Kollisionsgefahr, deshalb hier nicht angefasst.)
export function defaultAgendaItems(): AgendaItem[] {
  return [
    { id: "agenda-1", time: "16:00", label: "Sektempfang" },
    { id: "agenda-2", time: "17:00", label: "Zeremonie" },
    { id: "agenda-3", time: "19:00", label: "Feier" },
  ];
}

export function newAgendaItem(): AgendaItem {
  return { id: crypto.randomUUID(), time: "", label: "Neuer Programmpunkt" };
}

export function moveAgendaItem(items: AgendaItem[], id: string, direction: "up" | "down"): AgendaItem[] {
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return items;
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= items.length) return items;
  const next = [...items];
  [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
  return next;
}
