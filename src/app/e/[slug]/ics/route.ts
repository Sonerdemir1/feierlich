import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildIcsEvent } from "@/lib/ics";

// Oeffentlich wie die Event-Seite selbst (/e/[slug]) — Gaeste laden die
// Erinnerung ohne Konto herunter. Gleiche Sichtbarkeitsregel: nur
// veroeffentlichte Events, ausser fuer den Besitzer selbst (Vorschau).
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug }, include: { eventType: true } });
  if (!event) return new Response("Nicht gefunden.", { status: 404 });

  if (event.status !== "PUBLISHED") {
    const session = await auth();
    if (session?.user?.id !== event.ownerId) {
      return new Response("Nicht gefunden.", { status: 404 });
    }
  }

  const location = [event.locationName, event.locationAddress].filter(Boolean).join(", ") || undefined;
  const ics = buildIcsEvent({
    uid: event.id,
    title: event.title,
    description: event.description ?? `${event.eventType.name} · einladi`,
    location,
    date: event.eventDate,
    time: event.eventTime,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
