import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventHasFeature } from "@/lib/event-features";
import { generatePhotobookPdf } from "@/lib/photobook-pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return new Response("Nicht angemeldet.", { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: { order: { include: { package: true } } },
  });
  if (!event || event.ownerId !== session.user.id) {
    return new Response("Nicht gefunden.", { status: 404 });
  }
  if (!eventHasFeature(event, "photobook")) {
    return new Response("Gästefotobuch ist in diesem Paket nicht enthalten.", { status: 403 });
  }

  const savedOrder: string[] = event.photobookMediaIds ? JSON.parse(event.photobookMediaIds) : [];
  if (savedOrder.length === 0) {
    return new Response("Noch keine Fotos für das Fotobuch ausgewählt.", { status: 400 });
  }

  // Wie beim Rendern der Auswahl (page.tsx) gegen aktuell freigegebene
  // IMAGE-Fotos abgleichen, statt der gespeicherten Reihenfolge blind zu
  // vertrauen — ein zwischenzeitlich verstecktes/geloeschtes Foto darf
  // nicht mehr ins PDF gelangen.
  const galleryItems = await prisma.galleryItem.findMany({
    where: { eventId: id, status: "APPROVED", media: { type: "IMAGE" } },
    include: { media: true },
  });
  const mediaById = new Map(galleryItems.map((item) => [item.mediaId, item.media]));
  const orderedPhotos = savedOrder
    .map((mediaId) => mediaById.get(mediaId))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .map((m) => ({ url: m.url, mimeType: m.mimeType }));

  if (orderedPhotos.length === 0) {
    return new Response("Die ausgewählten Fotos sind nicht mehr verfügbar.", { status: 400 });
  }

  const eventDateLabel = new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(event.eventDate);
  const pdfBytes = await generatePhotobookPdf({
    coupleNames: event.title,
    eventDateLabel,
    photos: orderedPhotos,
  });

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fotobuch-${event.slug}.pdf"`,
    },
  });
}
