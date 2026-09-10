import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const EDITABLE_FIELDS = new Set([
  "title",
  "subtitle",
  "description",
  "loveStoryText",
  "eventLabel",
  "familyLeft",
  "familyRight",
  "guestbookHeading",
  "guestbookHint",
  "guestbookButtonText",
  "wishlistHeading",
  "wishlistHint",
  "musicHeading",
  "musicHint",
  "musicButtonText",
  "countdownDaysLabel",
  "countdownHoursLabel",
  "countdownMinutesLabel",
  "calendarSaveText",
  "calendarGoogleText",
  "rsvpHeading",
  "rsvpYesLabel",
  "rsvpMaybeLabel",
  "rsvpNoLabel",
  "rsvpButtonText",
  "seatingHeading",
  "seatingHint",
  "seatingButtonText",
  "galleryHeading",
  "galleryHint",
  "galleryButtonText",
  "dresscodeHeading",
  "dresscodeText",
  "socialMediaHeading",
  "socialMediaText",
  "menuHeading",
  "menuHint",
  "thankYouHeading",
  "thankYouMessage",
  "audioInvitationHeading",
  "audioInvitationHint",
  "videoMessageHeading",
  "videoMessageHint",
]);

// "thankYouMessage" liegt anders als alle anderen Felder NICHT als eigene
// Event-Spalte, sondern im JSON-config-Feld des "thank-you-card"-
// EventModule-Datensatzes (siehe e/[slug]/page.tsx moduleConfig() und die
// bestehende Alt-Form in dashboard/events/[id]/page.tsx/actions.ts, die
// dieselbe Stelle beschreibt) — die neue Klick-Bearbeitung schreibt bewusst
// an dieselbe Stelle statt eine zweite, konkurrierende Quelle der Wahrheit
// einzufuehren.
const MODULE_CONFIG_FIELDS: Record<string, string> = { thankYouMessage: "thank-you-card" };

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

  const moduleKey = MODULE_CONFIG_FIELDS[field];
  if (moduleKey) {
    const mod = await prisma.module.findUnique({ where: { key: moduleKey } });
    if (!mod) return new Response("Modul nicht gefunden.", { status: 404 });
    const existing = await prisma.eventModule.findUnique({ where: { eventId_moduleId: { eventId: id, moduleId: mod.id } } });
    const config = existing?.config ? JSON.parse(existing.config) : {};
    config.message = value || undefined;
    await prisma.eventModule.upsert({
      where: { eventId_moduleId: { eventId: id, moduleId: mod.id } },
      update: { config: JSON.stringify(config) },
      create: { eventId: id, moduleId: mod.id, enabled: true, config: JSON.stringify(config) },
    });
  } else {
    await prisma.event.update({ where: { id }, data: { [field]: value || null } });
  }
  revalidatePath(`/dashboard/events/${id}`);
  revalidatePath(`/e/${event.slug}`);

  return Response.json({ ok: true });
}
