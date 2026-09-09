"use client";

import { useState } from "react";

export type PhotobookPhoto = {
  mediaId: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  uploaderName: string | null;
};

// pdf-lib kann nur JPEG/PNG einbetten (keine WEBP-/GIF-Dekodierung) — siehe
// photobook-pdf.ts isEmbeddableMimeType(). Nicht unterstuetzte Formate
// werden hier bereits an der Auswahl gehindert, statt sie erst beim PDF-
// Generieren stillschweigend zu ueberspringen (der Nutzer soll nie ein
// ausgewaehltes Foto vermissen, ohne zu wissen warum).
function isEmbeddable(mimeType: string): boolean {
  return mimeType === "image/jpeg" || mimeType === "image/png";
}

export function PhotobookPicker({ photos, initialSelectedIds }: { photos: PhotobookPhoto[]; initialSelectedIds: string[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const photoByMediaId = new Map(photos.map((p) => [p.mediaId, p]));

  function toggle(mediaId: string) {
    const photo = photoByMediaId.get(mediaId);
    if (!photo || !isEmbeddable(photo.mimeType)) return;
    setSelectedIds((prev) => (prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId]));
  }

  function remove(mediaId: string) {
    setSelectedIds((prev) => prev.filter((id) => id !== mediaId));
  }

  function move(mediaId: string, direction: "up" | "down") {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(mediaId);
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (idx === -1 || swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  }

  return (
    <div>
      <input type="hidden" name="selectedMediaIds" value={selectedIds.join(",")} />

      <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>
        Freigegebene Fotos ({photos.length}) — anklicken zum Hinzufügen/Entfernen
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8, marginBottom: 28 }}>
        {photos.map((photo) => {
          const selectedIndex = selectedIds.indexOf(photo.mediaId);
          const embeddable = isEmbeddable(photo.mimeType);
          return (
            <button
              type="button"
              key={photo.mediaId}
              onClick={() => toggle(photo.mediaId)}
              disabled={!embeddable}
              title={embeddable ? undefined : "Format nicht unterstützt (nur JPEG/PNG)"}
              style={{
                position: "relative",
                padding: 0,
                border: selectedIndex >= 0 ? "2px solid var(--terracotta)" : "1px solid var(--line)",
                background: "none",
                cursor: embeddable ? "pointer" : "not-allowed",
                opacity: embeddable ? 1 : 0.4,
                aspectRatio: "1 / 1",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnailUrl ?? photo.url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {selectedIndex >= 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    background: "var(--terracotta)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedIndex + 1}
                </span>
              )}
              {!embeddable && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "rgba(33,28,25,0.75)",
                    color: "#fff",
                    fontSize: 9.5,
                    padding: "3px 4px",
                    textAlign: "center",
                  }}
                >
                  Format n. unterstützt
                </span>
              )}
            </button>
          );
        })}
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>
        Ausgewählt &amp; Reihenfolge ({selectedIds.length})
      </h3>
      {selectedIds.length === 0 ? (
        <p style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>Noch keine Fotos ausgewählt.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {selectedIds.map((mediaId, i) => {
            const photo = photoByMediaId.get(mediaId);
            if (!photo) return null;
            return (
              <div
                key={mediaId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid var(--line)",
                  padding: "6px 10px",
                  background: "var(--ivory)",
                }}
              >
                <span style={{ fontSize: 11.5, color: "var(--ink-faint)", width: 18 }}>{i + 1}.</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbnailUrl ?? photo.url}
                  alt=""
                  style={{ width: 36, height: 36, objectFit: "cover", border: "1px solid var(--line)", flexShrink: 0 }}
                />
                <span style={{ flex: "1 1 auto", minWidth: 0, fontSize: 12, color: "var(--ink-soft)" }}>
                  {photo.uploaderName ? `Foto von ${photo.uploaderName}` : "Foto"}
                </span>
                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => move(mediaId, "up")}
                    disabled={i === 0}
                    aria-label="Nach oben"
                    style={{ width: 24, height: 24, border: "1px solid var(--line)", background: "#ffffff", cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.35 : 1, fontSize: 11 }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(mediaId, "down")}
                    disabled={i === selectedIds.length - 1}
                    aria-label="Nach unten"
                    style={{
                      width: 24,
                      height: 24,
                      border: "1px solid var(--line)",
                      background: "#ffffff",
                      cursor: i === selectedIds.length - 1 ? "default" : "pointer",
                      opacity: i === selectedIds.length - 1 ? 0.35 : 1,
                      fontSize: 11,
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(mediaId)}
                    aria-label="Entfernen"
                    style={{ width: 24, height: 24, border: "1px solid var(--line)", background: "#ffffff", cursor: "pointer", fontSize: 11, color: "var(--terracotta-dark)" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
