"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { InlineEditableText } from "@/components/public/InlineEditableText";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { broadcastSelection, useSelectionBroadcast } from "@/lib/local-selection";

// Duenner Client-Wrapper, weil e/[slug]/page.tsx (Server Component) die
// Beschreibung ausserhalb von HeroCard.tsx rendert (eigener Abschnitt unter
// der Karte) und daher nicht dessen lokalen selectedKey-State teilt.
export function EditableDescription({ eventId, value, style }: { eventId: string; value: string; style: CSSProperties }) {
  const [selected, setSelected] = useState(false);

  useSelectionBroadcast(useCallback((identity) => setSelected(identity === "description"), []));

  function select() {
    broadcastSelection("description");
    window.parent.postMessage({ type: "einladi-element-selected", key: "description" }, window.location.origin);
  }

  return (
    <SelectableElement kind="text" label="Beschreibung" selected={selected} onSelect={select}>
      <InlineEditableText eventId={eventId} field="description" value={value} placeholder="Beschreibung hinzufügen…" onFocus={select} style={style} />
    </SelectableElement>
  );
}
