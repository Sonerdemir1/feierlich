"use client";

import { useState, type CSSProperties, type ElementType } from "react";
import { InlineEditableField } from "@/components/public/InlineEditableField";

type Field = "title" | "subtitle" | "description" | "eventLabel" | "familyLeft" | "familyRight";

// Duenner Fetch-Wrapper um InlineEditableField.tsx (siehe Umsetzungsplan) —
// speichert per fetch() an die Dashboard-Route, zeigt Speicher-Status, und
// meldet Erfolg per postMessage an den umgebenden Dashboard-iframe. Wirft
// bei einem fehlgeschlagenen Speichern, damit InlineEditableField die
// Aenderung im DOM selbst rueckgaengig macht.
// Nur aktiv, wenn die Event-Seite mit ?dashboardPreview=1 im Dashboard-
// iframe eingebettet ist UND der Betrachter der Owner ist (beides serverseitig
// in page.tsx geprueft, bevor diese Komponente ueberhaupt gerendert wird) —
// echte Gaeste sehen nie ein contentEditable-Element.
export function InlineEditableText({
  eventId,
  field,
  value,
  as = "div",
  placeholder,
  style,
  onFocus,
}: {
  eventId: string;
  field: Field;
  value: string;
  as?: ElementType;
  placeholder?: string;
  style?: CSSProperties;
  onFocus?: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleChange(text: string) {
    setStatus("saving");
    try {
      const res = await fetch(`/dashboard/events/${eventId}/inline-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value: text }),
      });
      if (!res.ok) throw new Error("save failed");
      setStatus("saved");
      window.parent.postMessage({ type: "einladi-inline-saved" }, window.location.origin);
      setTimeout(() => setStatus("idle"), 1400);
    } catch (err) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1800);
      throw err;
    }
  }

  return (
    <InlineEditableField
      value={value}
      onChange={handleChange}
      as={as}
      placeholder={placeholder}
      style={style}
      onFocus={onFocus}
      multiline={field === "description"}
      status={status}
    />
  );
}
