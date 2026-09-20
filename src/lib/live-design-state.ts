import type { StyleElements } from "@/lib/text-style";
import type { AgendaItem } from "@/lib/agenda";
import type { WishlistItemData } from "@/lib/wishlist";
import type { WeddingPartyMemberData } from "@/lib/wedding-party";
import type { PhotoShape } from "@/lib/photo-shape";

type Colors = { primary: string; accent: string; background: string };

// Frueher in HeroCard.tsx definiert (vor der Aufloesung in die geteilten
// invitation-sections-Komponenten, Plan-Phase D) — eigene Datei, weil
// mehrere Editable*.tsx-Komponenten AUSSERHALB der Hero-Kartenflaeche
// (Ort/Ablaufplan/Gaestebuch/Wunschliste/generische Abschnittstexte) diesen
// Typ ebenfalls brauchen, um denselben postMessage-Broadcast aus dem
// Dashboard-Editor (DesignEditor.tsx) mitzulesen.
export type LiveDesignState = {
  colors: Colors;
  fontId?: string;
  ornaments: boolean;
  elements?: StyleElements;
  // Live-Override fuers Datum (DateQuickEdit.tsx) — undefined laesst die
  // serverseitig berechneten eventDate/eventTime-Props unangetastet,
  // gesetzt aktualisiert Datumszeile + Countdown sofort ohne Seiten-Reload.
  eventDateIso?: string;
  eventTime?: string | null;
  // Live-Override fuer die Location (LocationQuickEdit.tsx) — wird selbst
  // nicht im Hero gerendert, aber ueber denselben Broadcast an
  // EditableLocation.tsx weitergereicht.
  locationName?: string | null;
  locationAddress?: string | null;
  // Live-Override fuer den Ablaufplan (siehe EditableAgenda.tsx).
  agendaItems?: AgendaItem[];
  // Live-Override fuer die Wunschliste (siehe EditableWishlist.tsx).
  wishlistItems?: WishlistItemData[];
  // Live-Override fuer Trauzeugen/Brautjungfern (siehe EditableWeddingParty.tsx).
  weddingPartyItems?: WeddingPartyMemberData[];
  // Uebernommen aus dem anonymen Gestalten-Entwurf (apply-draft/route.ts) —
  // nur gesetzt, wenn das Event aus einem Entwurf mit aktiv gewaehlter
  // Foto-Form entstand, sonst undefined (bestehende Events unveraendert).
  photoShape?: PhotoShape;
  showFloral?: boolean;
  showPhotoBackground?: boolean;
  // Live-Override fuer die Abschnitts-Reihenfolge (Inline Ein-/Ausblenden +
  // Umsortieren direkt am Element, siehe ReorderableSection.tsx) — volle
  // Liste aller umsortierbaren Abschnitts-Schluessel (nicht nur sichtbare),
  // gleiche Form wie Event.styleJson.sectionOrder / DesignStudio.tsx'
  // draft.sectionOrder.
  sectionOrder?: string[];
};
