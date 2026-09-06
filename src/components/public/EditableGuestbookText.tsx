"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ElementType } from "react";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { InlineEditableText } from "@/components/public/InlineEditableText";
import { elementOverrideStyle } from "@/lib/text-style";
import { broadcastSelection, useSelectionBroadcast } from "@/lib/local-selection";
import type { LiveDesignState } from "@/components/public/HeroCard";

// Duenner Client-Wrapper wie EditableDescription.tsx (gleicher Grund: die
// drei Gaestebuch-Texte werden von e/[slug]/page.tsx ausserhalb von
// HeroCard.tsx gerendert) — hier aber EIN geteilter Baustein statt drei
// fast identischer Dateien, weil alle drei (Ueberschrift/Hinweistext/
// Button-Beschriftung) reiner Einzeiler-Text ohne Sonderfelder sind, genau
// wie Titel/Untertitel. Feldname (DB-Spalte/inline-text-Route) und
// TextElementKey (Stil-Ablage in styleJson) sind bewusst identisch benannt,
// um die sonst leicht auseinanderlaufenden zwei Namen zu vermeiden.
//
// Anders als EditableLocation.tsx/EditableDescription.tsx hoert dieser
// Baustein zusaetzlich auf state.elements: der Stil (Groesse/Ausrichtung/
// Farbe/Stil) wird sonst erst nach dem naechsten Neuladen sichtbar, obwohl
// der Hinweistext im Editor "wirkt sofort ... ohne Neuladen" verspricht —
// bei Titel/Untertitel (in HeroCard.tsx) gilt das schon, hier muss der
// Baustein es sich selbst holen, weil er ausserhalb von HeroCard rendert.
export function EditableGuestbookText({
  eventId,
  field,
  label,
  value,
  placeholder,
  style,
  as = "div",
}: {
  eventId: string;
  field: "guestbookHeading" | "guestbookHint" | "guestbookButtonText";
  label: string;
  value: string;
  placeholder: string;
  style: CSSProperties;
  as?: ElementType;
}) {
  const [selected, setSelected] = useState(false);
  const [liveOverride, setLiveOverride] = useState<CSSProperties>({});

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-style-preview") return;
      const state = event.data.state as LiveDesignState;
      setLiveOverride(elementOverrideStyle(state.elements, field));
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [field]);

  useSelectionBroadcast(useCallback((identity) => setSelected(identity === field), [field]));

  function select() {
    broadcastSelection(field);
    window.parent.postMessage({ type: "einladi-element-selected", key: field }, window.location.origin);
  }

  return (
    <SelectableElement kind="text" label={label} selected={selected} onSelect={select}>
      <InlineEditableText eventId={eventId} field={field} value={value} as={as} placeholder={placeholder} onFocus={select} style={{ ...style, ...liveOverride }} />
    </SelectableElement>
  );
}
