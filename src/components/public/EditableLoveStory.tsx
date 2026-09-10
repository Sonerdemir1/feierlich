"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { InlineEditableText } from "@/components/public/InlineEditableText";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { broadcastSelection, useSelectionBroadcast } from "@/lib/local-selection";

// Duenner Client-Wrapper fuer Event.loveStoryText — 1:1 Kopie des Musters
// aus EditableDescription.tsx (siehe dortiger Kommentar), eigene Datei statt
// Wiederverwendung, da e/[slug]/page.tsx die beiden Felder als zwei
// unabhaengige Abschnitte mit unterschiedlichem field-Wert rendert.
export function EditableLoveStory({ eventId, value, style }: { eventId: string; value: string; style: CSSProperties }) {
  const [selected, setSelected] = useState(false);

  useSelectionBroadcast(useCallback((identity) => setSelected(identity === "loveStoryText"), []));

  function select() {
    broadcastSelection("loveStoryText");
    window.parent.postMessage({ type: "einladi-element-selected", key: "loveStoryText" }, window.location.origin);
  }

  return (
    <SelectableElement kind="text" label="Kennenlerngeschichte" selected={selected} onSelect={select}>
      <InlineEditableText
        eventId={eventId}
        field="loveStoryText"
        value={value}
        placeholder="Eure Kennenlerngeschichte hinzufügen…"
        onFocus={select}
        style={style}
      />
    </SelectableElement>
  );
}
