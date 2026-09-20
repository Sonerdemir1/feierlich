"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import type { TextField } from "@/components/invitation-sections/EditableText";
import { broadcastSelection, useSelectionBroadcast } from "@/lib/local-selection";
import { elementOverrideStyle, type TextElementKey, type StyleElements, type TextElementStyle } from "@/lib/text-style";

// Baut ein TextField (siehe invitation-sections/EditableText.tsx) fuer die
// ECHTE Event-Seite (e/[slug]/page.tsx, editMode nur im Dashboard-iframe
// mit ?dashboardPreview=1) — Pendant zu tf() in DesignStudio.tsx, nur mit
// echtem Speichern statt localStorage. Konsolidiert, was bisher pro Feld
// fast identisch in EditableSectionText.tsx/EditableDescription.tsx/
// EditableLoveStory.tsx/HeroCard.tsx stand: Auswahl + Live-Stil-Override
// laufen ueber denselben postMessage-/local-selection-Kanal wie bisher,
// das Speichern ruft dieselbe /inline-text-Route wie bisher
// InlineEditableText.tsx auf — Hero.tsx/CoupleIntro.tsx/etc. selbst
// bleiben dabei UNVERAENDERT, dieselben Komponenten wie in DesignStudio.tsx.
//
// `saveField` entkoppelt Auswahl-/Stil-Identitaet von der tatsaechlichen
// DB-Spalte — noetig fuer die Familiennamen: EIN "family"-TextElementKey
// steuert Auswahl+Stil fuer BEIDE Namen zusammen (wie bisher in
// HeroCard.tsx renderFamily()), gespeichert wird aber je Name einzeln unter
// "familyLeft"/"familyRight" (siehe inline-text/route.ts EDITABLE_FIELDS).
export function useLiveField(
  eventId: string,
  field: TextElementKey,
  value: string,
  options?: { saveField?: string }
): { field: TextField; styleOverride: CSSProperties; rawStyle: TextElementStyle; onStyleChange: (patch: Partial<TextElementStyle>) => void } {
  const saveField = options?.saveField ?? field;
  const [selected, setSelected] = useState(false);
  const [styleOverride, setStyleOverride] = useState<CSSProperties>({});
  const [rawStyle, setRawStyle] = useState<TextElementStyle>({});

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-style-preview") return;
      const state = event.data.state as { elements?: StyleElements } | undefined;
      setStyleOverride(elementOverrideStyle(state?.elements, field));
      setRawStyle(state?.elements?.[field] ?? {});
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [field]);

  // Kontext-Toolbar am Element (ElementToolbar.tsx) — sendet Groesse/
  // Ausrichtung/Farbe/Schrift-Patches direkt aus dem iframe, landet im
  // Dashboard-Elternfenster auf demselben setElementStyle()-Pfad wie die
  // TextControls-Instanz im Seitenpanel (siehe DesignEditor.tsx).
  const onStyleChange = useCallback(
    (patch: Partial<TextElementStyle>) => {
      setRawStyle((prev) => ({ ...prev, ...patch }));
      window.parent.postMessage({ type: "einladi-style-patch", key: field, patch }, window.location.origin);
    },
    [field]
  );

  useSelectionBroadcast(useCallback((identity) => setSelected(identity === field), [field]));

  const onSelect = useCallback(() => {
    broadcastSelection(field);
    window.parent.postMessage({ type: "einladi-element-selected", key: field }, window.location.origin);
  }, [field]);

  const onChange = useCallback(
    async (text: string) => {
      const res = await fetch(`/dashboard/events/${eventId}/inline-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: saveField, value: text }),
      });
      if (!res.ok) throw new Error("save failed");
      window.parent.postMessage({ type: "einladi-inline-saved" }, window.location.origin);
    },
    [eventId, saveField]
  );

  return { field: { value, onChange, selected, onSelect }, styleOverride, rawStyle, onStyleChange };
}
