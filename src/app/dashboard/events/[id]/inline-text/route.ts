import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const EDITABLE_FIELDS = new Set(["title", "subtitle", "description", "eventLabel", "familyLeft", "familyRight"]);

// Speichert eine per Klick-Bearbeitung auf der Live-Vorschau (iframe mit
// ?dashboardPreview=1) geaenderte Textstelle — direkt per fetch() aus dem
// gleichen Origin, kein postMessage-Umweg noetig, da Dashboard und
// Vorschau-Seite auf derselben Domain laufen.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const body = await request.json().catch(() => null);
  const field = typeof body?.field === "string" ? body.field : "";
  const value = typeof body?.value === "string" ? body.value.trim() : "";
  if (!EDITABLE_FIELDS.has(field)) return new Response("Ungültiges Feld.", { status: 400 });
  if (field === "title" && !value) return new Response("Titel darf nicht leer sein.", { status: 400 });

  await prisma.event.update({ where: { id }, data: { [field]: value || null } });
  revalidatePath(`/dashboard/events/${id}`);
  revalidatePath(`/e/${event.slug}`);

  return Response.json({ ok: true });
}
