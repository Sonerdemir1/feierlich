export type WeddingPartyRole = "TRAUZEUGE" | "BRAUTJUNGFER";

export const WEDDING_PARTY_ROLES: WeddingPartyRole[] = ["TRAUZEUGE", "BRAUTJUNGFER"];

export const WEDDING_PARTY_ROLE_LABEL: Record<WeddingPartyRole, string> = {
  TRAUZEUGE: "Trauzeugen",
  BRAUTJUNGFER: "Brautjungfern",
};

// Reine Anzeige-/Editierdaten fuer EINEN Eintrag — gleiches Muster wie
// WishlistItemData (lib/wishlist.ts). `photoUrl` traegt waehrend des
// anonymen Gestalten-Entwurfs eine data:-URL (siehe DesignStudio.tsx
// handleImageFile-Muster), auf der echten Event-Seite dagegen die
// tatsaechliche Media.url (photoId wird dort separat mitgefuehrt, siehe
// WeddingPartyMemberData vs. das echte Prisma-Model).
export type WeddingPartyMemberData = {
  id: string;
  role: WeddingPartyRole;
  name: string;
  // Anzeige-URL — im Gestalten-Entwurf eine data:-URL (lokal, siehe
  // handleWeddingPartyPhotoFile in DesignStudio.tsx), auf der echten
  // Event-Seite die tatsaechliche Media.url nach echtem Server-Upload.
  photoUrl: string;
  // Nur auf der echten Event-Seite gesetzt (Dashboard/DesignEditor.tsx) —
  // verweist auf die hochgeladene Media-Zeile, wird beim Speichern der
  // Liste mitgeschickt (siehe wedding-party/route.ts). Im Gestalten-Entwurf
  // immer undefined, da vor dem Signup noch kein Media-Upload stattfindet.
  photoId?: string;
};

// Feste ids wie defaultWishlistItems() — siehe dortiger Kommentar
// (DesignStudio.tsx berechnet draft bei jedem Render neu ueber
// mergedDraft(), zufaellige ids wuerden sich staendig aendern und die
// Auswahl entkoppeln).
export function defaultWeddingPartyMembers(): WeddingPartyMemberData[] {
  return [
    { id: "weddingparty-1", role: "TRAUZEUGE", name: "Trauzeuge", photoUrl: "" },
    { id: "weddingparty-2", role: "BRAUTJUNGFER", name: "Brautjungfer", photoUrl: "" },
  ];
}

export function newWeddingPartyMember(role: WeddingPartyRole = "TRAUZEUGE"): WeddingPartyMemberData {
  return { id: crypto.randomUUID(), role, name: role === "TRAUZEUGE" ? "Neuer Trauzeuge" : "Neue Brautjungfer", photoUrl: "" };
}

// Vertauscht mit dem naechsten Nachbarn DERSELBEN Rolle — gleiches Prinzip
// wie moveWishlistItem (Anzeige gruppiert nach Rolle).
export function moveWeddingPartyMember(
  items: WeddingPartyMemberData[],
  id: string,
  direction: "up" | "down"
): WeddingPartyMemberData[] {
  const item = items.find((it) => it.id === id);
  if (!item) return items;
  const sameRoleIndices = items.reduce<number[]>((acc, it, i) => {
    if (it.role === item.role) acc.push(i);
    return acc;
  }, []);
  const idx = items.indexOf(item);
  const pos = sameRoleIndices.indexOf(idx);
  const swapWithIdx = direction === "up" ? sameRoleIndices[pos - 1] : sameRoleIndices[pos + 1];
  if (swapWithIdx === undefined) return items;
  const next = [...items];
  [next[idx], next[swapWithIdx]] = [next[swapWithIdx], next[idx]];
  return next;
}
