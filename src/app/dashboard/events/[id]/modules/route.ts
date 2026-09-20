import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { gatedModuleKeys } from "@/app/dashboard/events/actions";

// AJAX-Pendant zu toggleModule() (actions.ts) — dort ein <form>-Server-
// Action-Aufruf mit Redirect zurueck zur Dashboard-Seite (passt fuer den
// bestehenden "Aktiv — ausschalten"-Button auf der Seite selbst). Fuers
// Inline-Ausblenden direkt am Element (ReorderableSection.tsx, im iframe)
// waere ein Redirect falsch — der wuerde das ganze Dashboard-Elternfenster
// neu laden statt nur die Vorschau. Gleiche Gating-Pruefung wie dort
// (tier-gesperrte Module lassen sich nicht ausschalten).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  const enabled = Boolean(body?.enabled);
  if (!key) return new Response("Ungültiges Modul.", { status: 400 });

  const gated = await gatedModuleKeys(id);
  if (gated.has(key)) return new Response("Modul nicht verfügbar.", { status: 403 });

  const mod = await prisma.module.findUnique({ where: { key } });
  if (!mod) return new Response("Modul nicht gefunden.", { status: 404 });

  await prisma.eventModule.upsert({
    where: { eventId_moduleId: { eventId: id, moduleId: mod.id } },
    update: { enabled },
    create: { eventId: id, moduleId: mod.id, enabled },
  });

  revalidatePath(`/dashboard/events/${id}`);
  revalidatePath(`/e/${event.slug}`);

  return Response.json({ ok: true });
}
