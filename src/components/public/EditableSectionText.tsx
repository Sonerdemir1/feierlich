"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ElementType } from "react";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { ElementToolbar } from "@/components/editor/ElementToolbar";
import { InlineEditableText } from "@/components/public/InlineEditableText";
import { elementOverrideStyle, type TextElementStyle } from "@/lib/text-style";
import { broadcastSelection, useSelectionBroadcast } from "@/lib/local-selection";
import type { LiveDesignState } from "@/lib/live-design-state";

// Generische Variante von EditableGuestbookText.tsx (Schritt 3) fuer
// einfache Ueberschriften/Hinweistexte/Button-/Label-Beschriftungen, die
// e/[slug]/page.tsx AUSSERHALB von HeroCard.tsx rendert (Wunschliste/
// Musikwuensche aus Schritt 4, RSVP-Radio-Beschriftungen aus Schritt 5,
// Sitzplan-Suche/Galerie aus Schritt 6) — ein geteilter Baustein statt
// vieler fast identischer Dateien.
// EditableGuestbookText.tsx bleibt unveraendert (nicht Teil dieser
// Schritte). Gleiches Live-Stil-Sync-Muster wie dort (siehe Kommentar in
// EditableGuestbookText.tsx): ohne den eigenen state.elements-Listener
// wuerde ein Stil-Klick erst nach einem Neuladen sichtbar.
export function EditableSectionText({
  eventId,
  field,
  label,
  value,
  placeholder,
  style,
  className,
  as = "div",
  defaultColor = "#211C19",
}: {
  eventId: string;
  field:
    | "coupleLeftName"
    | "coupleLeftBio"
    | "coupleRightName"
    | "coupleRightBio"
    | "wishlistHeading"
    | "wishlistHint"
    | "weddingPartyHeading"
    | "weddingPartyHint"
    | "musicHeading"
    | "musicHint"
    | "musicButtonText"
    | "rsvpHeading"
    | "rsvpYesLabel"
    | "rsvpMaybeLabel"
    | "rsvpNoLabel"
    | "rsvpButtonText"
    | "seatingHeading"
    | "seatingHint"
    | "seatingButtonText"
    | "galleryHeading"
    | "galleryHint"
    | "galleryButtonText"
    | "dresscodeHeading"
    | "dresscodeText"
    | "socialMediaHeading"
    | "socialMediaText"
    | "menuHeading"
    | "menuHint"
    | "thankYouHeading"
    | "thankYouMessage"
    | "audioInvitationHeading"
    | "audioInvitationHint"
    | "videoMessageHeading"
    | "videoMessageHint";
  label: string;
  value: string;
  placeholder: string;
  style: CSSProperties;
  className?: string;
  as?: ElementType;
  // Fuer die Kontext-Toolbar (ElementToolbar.tsx): Ausgangsfarbe fuers
  // Farb-Rad, bevor der Kunde "Eigene Farbe" anhakt — Aufrufer geben hier
  // colors.primary durch, Fallback nur fuer den (praktisch nie
  // vorkommenden) Fall eines fehlenden Aufruf-Updates.
  defaultColor?: string;
}) {
  const [selected, setSelected] = useState(false);
  const [liveOverride, setLiveOverride] = useState<CSSProperties>({});
  const [rawStyle, setRawStyle] = useState<TextElementStyle>({});

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-style-preview") return;
      const state = event.data.state as LiveDesignState;
      setLiveOverride(elementOverrideStyle(state.elements, field));
      setRawStyle(state.elements?.[field] ?? {});
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [field]);

  useSelectionBroadcast(useCallback((identity) => setSelected(identity === field), [field]));

  function select() {
    broadcastSelection(field);
    window.parent.postMessage({ type: "einladi-element-selected", key: field }, window.location.origin);
  }

  function changeStyle(patch: Partial<TextElementStyle>) {
    const next = { ...rawStyle, ...patch };
    setRawStyle(next);
    window.parent.postMessage({ type: "einladi-style-patch", key: field, patch }, window.location.origin);
  }

  return (
    <SelectableElement
      kind="text"
      label={label}
      selected={selected}
      onSelect={select}
      style={{ display: "block" }}
      toolbar={selected ? <ElementToolbar elementKey={field} style={rawStyle} defaultColor={defaultColor} onChange={changeStyle} /> : undefined}
    >
      <InlineEditableText eventId={eventId} field={field} value={value} as={as} placeholder={placeholder} onFocus={select} style={{ ...style, ...liveOverride }} className={className} />
    </SelectableElement>
  );
}
