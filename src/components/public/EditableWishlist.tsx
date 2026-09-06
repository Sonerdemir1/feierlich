"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { WishlistList } from "@/components/editor/WishlistList";
import type { WishlistItemData } from "@/lib/wishlist";
import type { LiveDesignState } from "@/components/public/HeroCard";
import { broadcastSelection, useSelectionBroadcast } from "@/lib/local-selection";

// Siehe Kommentar in EditableAgenda.tsx (gleiches Muster/gleicher Fund).
const PREFIX = "wishlist:";

// Duenner Client-Wrapper wie EditableAgenda.tsx (identisches Muster: keine
// eigene Persistenz, nur Anzeige + Melden von Auswahl/Wuenschen nach oben
// per "einladi-wishlist-request" — DesignEditor.tsx bleibt alleinige Quelle
// fuer state.wishlistItems, siehe dortigen Kommentar zu state.agendaItems).
export function EditableWishlist({
  initialItems,
  baseStyle,
  accentColor,
}: {
  initialItems: WishlistItemData[];
  baseStyle: CSSProperties;
  accentColor: string;
}) {
  const [items, setItems] = useState<WishlistItemData[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-style-preview") return;
      const state = event.data.state as LiveDesignState;
      if (state.wishlistItems !== undefined) setItems(state.wishlistItems ?? []);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useSelectionBroadcast(
    useCallback((identity) => setSelectedId(identity.startsWith(PREFIX) ? identity.slice(PREFIX.length) : undefined), [])
  );

  function select(id: string) {
    broadcastSelection(PREFIX + id);
    window.parent.postMessage({ type: "einladi-element-selected", key: "wishlist", itemId: id }, window.location.origin);
  }

  function request(action: "add" | "remove" | "move", extra?: { itemId?: string; direction?: "up" | "down" }) {
    window.parent.postMessage({ type: "einladi-wishlist-request", action, ...extra }, window.location.origin);
  }

  return (
    <WishlistList
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
