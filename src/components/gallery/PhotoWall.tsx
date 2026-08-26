"use client";

import { useState } from "react";
import { PhotoTagger } from "./PhotoTagger";

type Photo = { id: string; mediaId: string; url: string; tags: { id: string; firstName: string }[] };
type TaggedGuest = { id: string; firstName: string; count: number };
type Colors = { primary: string; accent: string; background: string };

// Haelt den Filter-State fuer die Foto-/Video-Wand. Muss ein Client-
// Component sein (useState) — page.tsx selbst ist ein async Server
// Component (Prisma-Zugriff, notFound()) und kann keine Hooks halten,
// daher liegt der State hier statt direkt auf Seitenebene.
export function PhotoWall({
  eventId,
  photos,
  taggedGuests,
  colors,
}: {
  eventId: string;
  photos: Photo[];
  taggedGuests: TaggedGuest[];
  colors: Colors;
}) {
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  const visiblePhotos = selectedGuestId
    ? photos.filter((p) => p.tags.some((t) => t.id === selectedGuestId))
    : photos;

  return (
    <>
      {taggedGuests.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setSelectedGuestId(null)}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "6px 13px",
              border: `1px solid ${colors.accent}88`,
              background: selectedGuestId === null ? colors.accent : "transparent",
              color: selectedGuestId === null ? colors.background : colors.primary,
              cursor: "pointer",
            }}
          >
            Alle anzeigen
          </button>
          {taggedGuests.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGuestId(g.id)}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                padding: "6px 13px",
                border: `1px solid ${colors.accent}88`,
                background: selectedGuestId === g.id ? colors.accent : "transparent",
                color: selectedGuestId === g.id ? colors.background : colors.primary,
                cursor: "pointer",
              }}
            >
              {g.firstName} ({g.count})
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, marginBottom: 24 }}>
        {visiblePhotos.map((photo) => (
          <PhotoTagger
            key={photo.id}
            eventId={eventId}
            mediaId={photo.mediaId}
            imageUrl={photo.url}
            initialTags={photo.tags}
          />
        ))}
      </div>
    </>
  );
}
