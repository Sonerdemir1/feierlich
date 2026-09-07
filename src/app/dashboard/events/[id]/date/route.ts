import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Speichert eine per DateQuickEdit.tsx (Kontext-Panel im Dashboard-Editor,
// Klick auf die Datumszeile auf der Karte) geaenderte Uhrzeit/Datum — analog
// zu inline-text/route.ts und design/route.ts: kein Redirect/Remount, der
// Vorschau-iframe wurde vom Panel bereits per postMessage live aktualisiert.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const body = await request.json().catch(() => null);
  const eventDate = typeof body?.eventDate === "string" ? body.eventDate : "";
  const eventTime = typeof body?.eventTime === "string" && body.eventTime.trim() ? body.eventTime.trim() : null;
  if (!eventDate || Number.isNaN(new Date(eventDate).getTime())) return new Response("Ungültiges Datum.", { status: 400 });

  await prisma.event.update({ where: { id }, data: { eventDate: new Date(eventDate), eventTime } });
  revalidatePath(`/dashboard/events/${id}`);
  revalidatePath(`/e/${event.slug}`);

  return Response.json({ ok: true });
}
