"use client";

import { useState, type CSSProperties } from "react";
import { InlineEditableText } from "@/components/public/InlineEditableText";
import { SelectableElement } from "@/components/editor/SelectableElement";

// Duenner Client-Wrapper, weil e/[slug]/page.tsx (Server Component) die
// Beschreibung ausserhalb von HeroCard.tsx rendert (eigener Abschnitt unter
// der Karte) und daher nicht dessen lokalen selectedKey-State teilt — die
// Auswahl der Beschreibung ist bewusst unabhaengig von der Auswahl auf der
// Karte selbst (zwei getrennte Seitenbereiche).
export function EditableDescription({ eventId, value, style }: { eventId: string; value: string; style: CSSProperties }) {
  const [selected, setSelected] = useState(false);

  function select() {
    setSelected(true);
    window.parent.postMessage({ type: "einladi-element-selected", key: "description" }, window.location.origin);
  }

  return (
    <SelectableElement kind="text" label="Beschreibung" selected={selected} onSelect={select}>
      <InlineEditableText eventId={eventId} field="description" value={value} placeholder="Beschreibung hinzufügen…" onFocus={select} style={style} />
    </SelectableElement>
  );
}
