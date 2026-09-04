import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { buildDesignUpdate } from "@/lib/design-style";

// Speichert Design-Aenderungen (Farben, Schriftart, Verzierungen,
// Pro-Element-Feinsteuerung) im Hintergrund, waehrend die Vorschau bereits
// per postMessage live aktualisiert wurde (siehe DesignControls.tsx) —
// gleiches Muster wie inline-text/route.ts fuer Titel/Untertitel: kein
// Redirect, kein Remount des Vorschau-iframes.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return new Response("Ungültige Daten.", { status: 400 });

  const formData = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") formData.set(key, value);
    else if (typeof value === "boolean" && value) formData.set(key, "on");
  }

  const { colorOverride, styleJson } = buildDesignUpdate(formData);
  await prisma.event.update({ where: { id }, data: { colorOverride, styleJson } });
  revalidatePath(`/dashboard/events/${id}`);
  revalidatePath(`/e/${event.slug}`);

  return Response.json({ ok: true });
}
