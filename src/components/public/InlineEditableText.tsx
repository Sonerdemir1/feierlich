"use client";

import { useRef, useState, type CSSProperties, type ElementType } from "react";

type Field = "title" | "subtitle" | "description";

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
}: {
  eventId: string;
  field: Field;
  value: string;
  as?: ElementType;
  placeholder?: string;
  style?: CSSProperties;
}) {
  const Tag = as;
  const original = useRef(value);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleBlur(e: React.FocusEvent<HTMLElement>) {
    const text = (e.currentTarget.innerText ?? "").trim();
    if (text === original.current) return;

    setStatus("saving");
    try {
      const res = await fetch(`/dashboard/events/${eventId}/inline-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value: text }),
      });
      if (!res.ok) throw new Error("save failed");
      original.current = text;
      setStatus("saved");
      window.parent.postMessage({ type: "einladi-inline-saved" }, window.location.origin);
      setTimeout(() => setStatus("idle"), 1400);
    } catch {
      e.currentTarget.innerText = original.current;
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1800);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (field !== "description" && e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      e.currentTarget.innerText = original.current;
      (e.target as HTMLElement).blur();
    }
  }

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      data-inline-status={status}
      className="einladi-inline-editable"
      style={{ outline: "none", cursor: "text", ...style }}
    >
      {value}
    </Tag>
  );
}
