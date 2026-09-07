"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { AgendaList } from "@/components/editor/AgendaList";
import type { AgendaItem } from "@/lib/agenda";
import type { LiveDesignState } from "@/components/public/HeroCard";
import { broadcastSelection, useSelectionBroadcast } from "@/lib/local-selection";

// Identity-Praefix fuer den globalen Auswahl-Broadcast (siehe
// lib/local-selection.ts) — wird ein ANDERES Element ausserhalb dieser
// Liste ausgewaehlt, muss selectedId hier auf undefined zurueckfallen,
// sonst bliebe ein Ablaufplan-Eintrag optisch "ausgewaehlt", waehrend z.B.
// die Wunschliste bearbeitet wird.
const PREFIX = "agenda:";

// Duenner Client-Wrapper wie EditableDescription.tsx/EditableLocation.tsx,
// weil e/[slug]/page.tsx (Server Component) den Ablaufplan ausserhalb von
// HeroCard.tsx rendert. Anders als bei den anderen Editable*-Komponenten
// besitzt dieser Baustein keine eigene Persistenz: Hinzufuegen/Entfernen/
// Umsortieren werden nur als Wunsch nach oben gemeldet
// ("einladi-agenda-request") — DesignEditor.tsx bleibt die alleinige Quelle
// fuer state.agendaItems (genau wie bei Farben/Schriftart), damit niemals
// zwei unabhaengige Kopien der Liste auseinanderlaufen koennen. Speichern
// von Uhrzeit/Bezeichnung/Stil eines einzelnen Eintrags laeuft ebenfalls
// ueber das Dashboard-Panel (AgendaItemQuickEdit/TextControls dort),
// dieser Baustein zeigt nur an und meldet Auswahl/Wuensche nach oben.
export function EditableAgenda({
  initialItems,
  baseStyle,
  accentColor,
}: {
  initialItems: AgendaItem[];
  baseStyle: CSSProperties;
  accentColor: string;
}) {
  const [items, setItems] = useState<AgendaItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-style-preview") return;
      const state = event.data.state as LiveDesignState;
      if (state.agendaItems !== undefined) setItems(state.agendaItems ?? []);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useSelectionBroadcast(
    useCallback((identity) => setSelectedId(identity.startsWith(PREFIX) ? identity.slice(PREFIX.length) : undefined), [])
  );

  function select(id: string) {
    broadcastSelection(PREFIX + id);
    window.parent.postMessage({ type: "einladi-element-selected", key: "agenda", itemId: id }, window.location.origin);
  }

  function request(action: "add" | "remove" | "move", extra?: { itemId?: string; direction?: "up" | "down" }) {
    window.parent.postMessage({ type: "einladi-agenda-request", action, ...extra }, window.location.origin);
  }

  return (
    <AgendaList
      items={items}
      selectedId={selectedId}
      onSelect={select}
      onAdd={() => request("add")}
      onRemove={(id) => request("remove", { itemId: id })}
      onMove={(id, direction) => request("move", { itemId: id, direction })}
      baseStyle={baseStyle}
      accentColor={accentColor}
    />
  );
}
