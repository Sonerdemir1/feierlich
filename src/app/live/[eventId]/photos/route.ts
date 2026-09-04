import { prisma } from "@/lib/prisma";
import { getLiveWallPhotos } from "@/lib/live-wall";

// Wird von LiveWallSlideshow.tsx alle paar Sekunden abgefragt (einfaches
// Polling statt echter Push-Technik — siehe docs/CREW.md fuer dieselbe
// Abwaegung: fuer "neue Fotos erscheinen automatisch" reicht das locker,
// keine neue Infrastruktur noetig). Oeffentlich, kein Login — die Seite
// haengt an einem Beamer/Fernseher im Saal.
export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return new Response("Nicht gefunden.", { status: 404 });

  const photos = await getLiveWallPhotos(eventId, event.liveWallMode, event.eventDate);
  return Response.json({ photos });
}
