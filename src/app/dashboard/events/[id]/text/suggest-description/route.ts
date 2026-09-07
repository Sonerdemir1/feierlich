import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { aiTextConfigured, generateAndRecordAttempt, AiTextQuotaError, AI_TEXT_ATTEMPT_QUOTA } from "@/lib/ai-text";
import { TURKISH_CATEGORIES } from "@/lib/gallery-templates";

// Direkter KI-Vorschlag-Button im Beschreibungstext-Panel des
// Dashboard-Editors (DesignEditor.tsx, Teil C) — nutzt dieselbe
// generateAndRecordAttempt()-Logik wie die bestehende Text-Assistent-Seite
// (siehe text/actions.ts::generateInvitationText), aber ohne Formular/
// Zwischenschritt: die Karte ist im Editor schon sichtbar, ein Klick soll
// direkt einen Vorschlag erzeugen UND ins echte Event.description schreiben
// (kein separates "Übernehmen" wie auf der Assistent-Seite noetig, gleiches
// Sofort-Speichern-Prinzip wie InlineEditableText fuer alle anderen Felder).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });
  if (!aiTextConfigured) return new Response("Text-Assistent ist nicht konfiguriert.", { status: 500 });

  const event = await prisma.event.findUnique({ where: { id }, include: { eventType: true, template: true } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  // Sprach-/Kategorie-Zuordnung wie defaultDescriptionForCategory()
  // (gallery-templates.ts) — dieselbe TURKISH_CATEGORIES-Menge, damit
  // tuerkische Vorlagen-Kategorien auch einen tuerkischen KI-Text bekommen.
  const language = TURKISH_CATEGORIES.has(event.template.category) ? "tr" : "de";

  let result;
  try {
    result = await generateAndRecordAttempt(id, {
      names: event.title,
      eventType: event.eventType.name,
      tone: "herzlich-leger",
      keyDetails: "",
      language,
    });
  } catch (err) {
    if (err instanceof AiTextQuotaError) return Response.json({ ok: false, error: "quota" }, { status: 429 });
    return Response.json({ ok: false, error: "failed" }, { status: 502 });
  }

  await prisma.event.update({ where: { id }, data: { description: result.description } });

  const attemptCount = await prisma.aiTextAttempt.count({ where: { eventId: id } });
  const attemptsLeft = Math.max(0, AI_TEXT_ATTEMPT_QUOTA - attemptCount);

  revalidatePath(`/dashboard/events/${id}`);
  revalidatePath(`/dashboard/events/${id}/text`);
  revalidatePath(`/e/${event.slug}`);

  return Response.json({ ok: true, description: result.description, attemptsLeft });
}
