"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { InlineEditableText } from "@/components/public/InlineEditableText";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { ElementToolbar } from "@/components/editor/ElementToolbar";
import { elementOverrideStyle, type TextElementStyle } from "@/lib/text-style";
import { broadcastSelection, useSelectionBroadcast } from "@/lib/local-selection";
import type { LiveDesignState } from "@/lib/live-design-state";

// Duenner Client-Wrapper fuer Event.loveStoryText — 1:1 Kopie des Musters
// aus EditableDescription.tsx (siehe dortiger Kommentar), eigene Datei statt
// Wiederverwendung, da e/[slug]/page.tsx die beiden Felder als zwei
// unabhaengige Abschnitte mit unterschiedlichem field-Wert rendert.
export function EditableLoveStory({ eventId, value, style, defaultColor = "#211C19" }: { eventId: string; value: string; style: CSSProperties; defaultColor?: string }) {
  const [selected, setSelected] = useState(false);
  const [liveOverride, setLiveOverride] = useState<CSSProperties>({});
  const [rawStyle, setRawStyle] = useState<TextElementStyle>({});

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-style-preview") return;
      const state = event.data.state as LiveDesignState;
      setLiveOverride(elementOverrideStyle(state.elements, "loveStoryText"));
      setRawStyle(state.elements?.loveStoryText ?? {});
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useSelectionBroadcast(useCallback((identity) => setSelected(identity === "loveStoryText"), []));

  function select() {
    broadcastSelection("loveStoryText");
    window.parent.postMessage({ type: "einladi-element-selected", key: "loveStoryText" }, window.location.origin);
  }

  function changeStyle(patch: Partial<TextElementStyle>) {
    setRawStyle({ ...rawStyle, ...patch });
    window.parent.postMessage({ type: "einladi-style-patch", key: "loveStoryText", patch }, window.location.origin);
  }

  return (
    <SelectableElement
      kind="text"
      label="Kennenlerngeschichte"
      selected={selected}
      onSelect={select}
      toolbar={selected ? <ElementToolbar elementKey="loveStoryText" style={rawStyle} defaultColor={defaultColor} onChange={changeStyle} /> : undefined}
    >
      <InlineEditableText
        eventId={eventId}
        field="loveStoryText"
        value={value}
        placeholder="Eure Kennenlerngeschichte hinzufügen…"
        onFocus={select}
        style={{ ...style, ...liveOverride }}
      />
    </SelectableElement>
  );
}
