import { prisma } from "@/lib/prisma";

// Saal-Live-Wand (/live/[eventId]) — Zeitpunkt, ab dem im "next-morning"-
// Modus zurueckgehaltene Fotos erscheinen: 7 Uhr am Kalendertag NACH dem
// Event-Datum. Bewusst ein fester Zeitpunkt statt eines Einstellfelds —
// "erst am Morgen danach" ist die vom Kunden vorgegebene Regel, kein
// Konfigurationsbedarf.
export function nextMorningCutoff(eventDate: Date): Date {
  const cutoff = new Date(eventDate);
  cutoff.setDate(cutoff.getDate() + 1);
  cutoff.setHours(7, 0, 0, 0);
  return cutoff;
}

export function liveWallPhotosVisible(liveWallMode: string, eventDate: Date): boolean {
  return liveWallMode !== "next-morning" || new Date() >= nextMorningCutoff(eventDate);
}

// Gemeinsam genutzt von live/[eventId]/page.tsx (Erstladung) und
// live/[eventId]/photos/route.ts (Polling danach) — dieselbe Abfrage,
// damit beide garantiert nie auseinanderlaufen.
export async function getLiveWallPhotos(eventId: string, liveWallMode: string, eventDate: Date) {
  if (!liveWallPhotosVisible(liveWallMode, eventDate)) return [];

  const items = await prisma.galleryItem.findMany({
    where: { eventId, status: "APPROVED", media: { type: "IMAGE" } },
    include: { media: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return items.map((i) => ({ id: i.id, url: i.media.url }));
}

// Fallback-Hashtag aus dem Eventtitel, falls unter dem "Social Media"-
// Modul kein eigener hinterlegt ist (EventModule.config, key "social-media",
// Feld "hashtag") — z. B. "Ayşe & Emre" -> "#AyseEmre".
export function fallbackHashtag(title: string): string {
  const cleaned = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Diakritika entfernen (ş->s, ğ->g, ...)
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .join("");
  return cleaned ? `#${cleaned}` : "";
}
