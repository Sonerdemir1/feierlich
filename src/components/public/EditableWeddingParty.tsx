"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { WeddingPartyList } from "@/components/editor/WeddingPartyList";
import type { WeddingPartyMemberData } from "@/lib/wedding-party";
import type { LiveDesignState } from "@/lib/live-design-state";
import { broadcastSelection, useSelectionBroadcast } from "@/lib/local-selection";

// Duenner Client-Wrapper wie EditableWishlist.tsx (identisches Muster):
// keine eigene Persistenz, nur Anzeige + Melden von Auswahl/Wuenschen nach
// oben per "einladi-wedding-party-request" — DesignEditor.tsx bleibt
// alleinige Quelle fuer state.weddingPartyItems UND fuer den echten Foto-
// Upload.
//
// Bugfix (live vom Nutzer gemeldet: "Foto-Kacheln lassen sich nicht wie bei
// einer Single-Boerse anklicken"): ein Klick auf den Foto-Kreis hat hier
// bisher NUR den Eintrag ausgewaehlt (wie ein Klick auf den Namen), der
// eigentliche Upload-Button lag dann in einem separaten Seitenpanel-Label
// im Elternfenster — ein zweiter, nicht offensichtlicher Klick war noetig.
// In der anonymen Gestalten-Vorschau (DesignStudio.tsx) reicht dagegen EIN
// Klick auf den Kreis (siehe requestWeddingPartyPhoto dort), was genau den
// vom Nutzer beschriebenen Bruch zwischen beiden Umgebungen verursacht hat
// (CLAUDE.md Regel 6: beide sollen sich wie dasselbe Produkt anfuehlen).
// Geloest OHNE den Datei-Dialog im Elternfenster per postMessage ausloesen
// zu muessen (das wuerde an fehlender User-Activation-Weitergabe ueber die
// Frame-Grenze scheitern) — der Datei-Dialog wird stattdessen direkt HIER
// im iframe geoeffnet (echter, same-origin Klick, 100% zuverlaessig), und
// die ausgewaehlte Datei (File-Objekt ist strukturiert klonbar) wird per
// postMessage ans Elternfenster weitergereicht, das den bestehenden
// uploadWeddingPartyPhoto()-Pfad unveraendert wiederverwendet.
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoTargetId = useRef<string | undefined>(undefined);

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

  function requestPhoto(id: string) {
    select(id);
    photoTargetId.current = id;
    fileInputRef.current?.click();
  }

  return (
    <>
      <WeddingPartyList
        items={items}
        selectedId={selectedId}
        onSelect={select}
        onAdd={(role) => request("add", { role })}
        onRemove={(id) => request("remove", { itemId: id })}
        onMove={(id, direction) => request("move", { itemId: id, direction })}
        onPhotoClick={requestPhoto}
        baseStyle={baseStyle}
        accentColor={accentColor}
      />
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          const itemId = photoTargetId.current;
          if (file && itemId) {
            window.parent.postMessage({ type: "einladi-wedding-party-photo-upload", itemId, file }, window.location.origin);
          }
          e.target.value = "";
        }}
      />
    </>
  );
}
