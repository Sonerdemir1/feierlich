"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { WeddingPartyList } from "@/components/editor/WeddingPartyList";
import type { WeddingPartyMemberData } from "@/lib/wedding-party";
import type { LiveDesignState } from "@/lib/live-design-state";
import { broadcastSelection, useSelectionBroadcast } from "@/lib/local-selection";

// Duenner Client-Wrapper wie EditableWishlist.tsx (identisches Muster):
// keine eigene Persistenz, nur Anzeige + Melden von Auswahl/Wuenschen nach
// oben per "einladi-wedding-party-request" — DesignEditor.tsx bleibt
// alleinige Quelle fuer state.weddingPartyItems UND fuer den echten Foto-
// Upload (der iframe hat keinen sinnvollen Zugriff auf einen eigenen
// Datei-Dialog, der mit dem Speichern im Elternfenster zusammenspielt) —
// ein Klick auf den Foto-Kreis waehlt hier deshalb nur den Eintrag aus,
// genau wie ein Klick auf den Namen (siehe onPhotoClick={select} unten).
const PREFIX = "weddingparty:";

export function EditableWeddingParty({
  initialItems,
  baseStyle,
  accentColor,
}: {
  initialItems: WeddingPartyMemberData[];
  baseStyle: CSSProperties;
  accentColor: string;
}) {
  const [items, setItems] = useState<WeddingPartyMemberData[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-style-preview") return;
      const state = event.data.state as LiveDesignState & { weddingPartyItems?: WeddingPartyMemberData[] };
      if (state.weddingPartyItems !== undefined) setItems(state.weddingPartyItems ?? []);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useSelectionBroadcast(
    useCallback((identity) => setSelectedId(identity.startsWith(PREFIX) ? identity.slice(PREFIX.length) : undefined), [])
  );

  function select(id: string) {
    broadcastSelection(PREFIX + id);
    window.parent.postMessage({ type: "einladi-element-selected", key: "wedding-party", itemId: id }, window.location.origin);
  }

  function request(action: "add" | "remove" | "move", extra?: { itemId?: string; direction?: "up" | "down"; role?: "TRAUZEUGE" | "BRAUTJUNGFER" }) {
    window.parent.postMessage({ type: "einladi-wedding-party-request", action, ...extra }, window.location.origin);
  }

  return (
    <WeddingPartyList
      items={items}
      selectedId={selectedId}
      onSelect={select}
      onAdd={(role) => request("add", { role })}
      onRemove={(id) => request("remove", { itemId: id })}
      onMove={(id, direction) => request("move", { itemId: id, direction })}
      onPhotoClick={select}
      baseStyle={baseStyle}
      accentColor={accentColor}
    />
  );
}
