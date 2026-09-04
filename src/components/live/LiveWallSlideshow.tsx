"use client";

import { useEffect, useRef, useState } from "react";

type Photo = { id: string; url: string };

const SLIDE_SECONDS = 7;
const POLL_MS = 20_000;

// Grosse Leinwand/Fernseher im Saal — bewusst extrem ruhig gehalten:
// keine Steuerung, kein Text ausser Uhrzeit/Hashtag, sanfte Ueberblendung
// statt harter Schnitte. Neue Fotos kommen per Polling rein (siehe
// live/[eventId]/photos/route.ts), niemand muss die Seite anfassen.
export function LiveWallSlideshow({
  eventId,
  initialPhotos,
  hashtag,
  emptyMessage,
}: {
  eventId: string;
  initialPhotos: Photo[];
  hashtag: string;
  emptyMessage: string | null;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState<string>("");
  const indexRef = useRef(0);

  // Uhrzeit — clientseitig, damit kein Server-Render-Zeitversatz sichtbar
  // wird und die Anzeige jede Minute weiterlaeuft, ohne dass irgendwer
  // die Seite neu laedt.
  useEffect(() => {
    function tick() {
      setNow(new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date()));
    }
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  // Neue Fotos nachladen, ohne die laufende Diashow zu unterbrechen —
  // Index bleibt stabil relativ zur bisherigen Liste, neue Fotos reihen
  // sich einfach hinten ein.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/live/${eventId}/photos`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.photos)) setPhotos(data.photos);
      } catch {
        // naechster Versuch kommt automatisch, kein Fehler auf dem Bildschirm noetig
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [eventId]);

  useEffect(() => {
    if (photos.length === 0) return;
    const id = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % photos.length;
      setIndex(indexRef.current);
    }, SLIDE_SECONDS * 1000);
    return () => clearInterval(id);
  }, [photos.length]);

  // Faellt die Foto-Liste beim naechsten Polling kleiner aus (z. B. ein
  // Foto nachtraeglich ausgeblendet), kann "index" kurzzeitig ausserhalb
  // liegen — hier nur fuers Rendern abgefangen statt per setState im
  // Effekt, das wuerde einen zusaetzlichen Render-Durchlauf erzwingen.
  const safeIndex = photos.length === 0 ? 0 : index % photos.length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0C0A09", overflow: "hidden" }}>
      {photos.length === 0 ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#EDE6DC", fontSize: "clamp(18px, 2.4vw, 32px)", textAlign: "center", padding: 40, fontFamily: "var(--font-display, serif)" }}>
          {emptyMessage ?? "Die ersten Fotos erscheinen hier gleich."}
        </div>
      ) : (
        photos.map((photo, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- Gaeste-Upload, unbekannte/wechselnde Aufloesung
          <img
            key={photo.id}
            src={photo.url}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: i === safeIndex ? 1 : 0,
              transition: "opacity 1800ms ease",
            }}
          />
        ))
      )}

      <div
        style={{
          position: "absolute",
          bottom: 18,
          right: 24,
          display: "flex",
          gap: 18,
          alignItems: "baseline",
          color: "rgba(237, 230, 220, 0.65)",
          fontSize: "clamp(11px, 1vw, 15px)",
          letterSpacing: "0.06em",
          fontFamily: "var(--font-body, sans-serif)",
        }}
      >
        {hashtag && <span>{hashtag}</span>}
        <span>{now}</span>
      </div>
    </div>
  );
}
