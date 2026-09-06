import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Speichert eine per LocationQuickEdit.tsx (Kontext-Panel im Dashboard-
// Editor, Klick auf den Ort-Bereich auf der Event-Seite) geaenderte
// Location — analog zu date/route.ts: kein Redirect/Remount, der Vorschau-
// iframe wurde vom Panel bereits per postMessage live aktualisiert.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const body = await request.json().catch(() => null);
  const locationName = typeof body?.locationName === "string" ? body.locationName.trim() || null : null;
  const locationAddress = typeof body?.locationAddress === "string" ? body.locationAddress.trim() || null : null;
  const locationLat = typeof body?.locationLat === "number" ? body.locationLat : null;
  const locationLng = typeof body?.locationLng === "number" ? body.locationLng : null;

  await prisma.event.update({ where: { id }, data: { locationName, locationAddress, locationLat, locationLng } });
  revalidatePath(`/dashboard/events/${id}`);
  revalidatePath(`/e/${event.slug}`);

  return Response.json({ ok: true });
}
