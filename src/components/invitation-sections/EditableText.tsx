"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { InlineEditableField } from "@/components/public/InlineEditableField";

export type TextField = {
  value: string;
  onChange: (text: string) => void;
  selected: boolean;
  onSelect: () => void;
};

// Gemeinsamer Baustein fuer alle Textstellen im One-Page-Baukasten
// (src/components/invitation-sections/) — verallgemeinert das Muster, das
// DesignStudio.tsx bisher pro Feld einzeln wiederholt hat (SelectableElement
// + InlineEditableField zusammen). Ohne `editable` (Gaeste-Seite, read-only)
// wird nur der reine Text gerendert — kein contentEditable, keine Klick-
// Auswahl. Mit `editable` (Gestalten-Vorschau/Dashboard) identisches
// Verhalten wie zuvor direkt in DesignStudio.tsx.
export function EditableText({
  field,
  editable = true,
  as = "span",
  placeholder,
  style,
  className,
  label,
  accentColor,
  toolbar,
}: {
  field: TextField;
  editable?: boolean;
  as?: ElementType;
  placeholder?: string;
  style?: CSSProperties;
  className?: string;
  label: string;
  accentColor?: string;
  // Kontext-Toolbar am Element (davetli.com-Stil, siehe ElementToolbar.tsx)
  // — optional, nur die echte Gaeste-Seite (useLiveField.ts) uebergibt sie
  // bisher; Gestalten-Vorschau (DesignStudio.tsx) bleibt unveraendert bei
  // reiner Seitenpanel-Bedienung.
  toolbar?: ReactNode;
}) {
  if (!editable) {
    const Tag = as;
    return (
      <Tag className={className} style={style}>
        {field.value || placeholder}
      </Tag>
    );
  }
  return (
    <SelectableElement kind="text" label={label} selected={field.selected} onSelect={field.onSelect} accentColor={accentColor} style={{ display: "block" }} toolbar={field.selected ? toolbar : undefined}>
      <InlineEditableField
        value={field.value}
        onChange={field.onChange}
        onFocus={field.onSelect}
        as={as}
        placeholder={placeholder}
        style={style}
        className={className}
      />
    </SelectableElement>
  );
}
