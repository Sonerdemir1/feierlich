import { prisma } from "@/lib/prisma";

// Gemeinsam genutzt von live/[eventId]/page.tsx (Erstladung) und
// live/[eventId]/photos/route.ts (Polling danach) — dieselbe Abfrage,
// damit beide garantiert nie auseinanderlaufen. Zeigt jedes ueber die
// Galerie-Moderation freigegebene (APPROVED) Foto sofort — der fruehere
// "next-morning"-Zeitsperren-Modus wurde entfernt, da die APPROVED-Pflicht
// bereits verhindert, dass unmoderierte Fotos auf der Wand landen (siehe
// Fund in der Bestandsaufnahme zur Live-Wand-Vereinfachung).
export async function getLiveWallPhotos(eventId: string) {
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
