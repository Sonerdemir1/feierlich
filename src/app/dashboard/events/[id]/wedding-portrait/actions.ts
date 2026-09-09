"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateImageFile, saveEventImage } from "@/lib/uploads";
import { putObject, readObject } from "@/lib/storage";
import { generateWeddingPortraitImage, weddingPortraitStyleByKey, WEDDING_PORTRAIT_ATTEMPT_QUOTA } from "@/lib/ai-wedding-portrait";
import { AiBudgetExceededError } from "@/lib/ai-budget-constants";
import { composeWeddingPortraitPreview } from "@/lib/wedding-portrait-preview";

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return event;
}

// Eigenes Foto des Brautpaares — bewusst getrennt vom Titelbild-Upload
// (uploadCoverImage), eigenes Feld (weddingPortraitSourceId), siehe Schema-
// Kommentar. Ueberschreibt ein evtl. vorheriges Foto (wie coverImageId),
// bisherige Portraet-Versuche (WeddingPortraitAttempt) bleiben unabhaengig
// davon erhalten.
export async function uploadWeddingPortraitSource(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const file = formData.get("file");
  const error = validateImageFile(file);
  if (error) redirect(`/dashboard/events/${eventId}/wedding-portrait?error=${error}`);

  const { url, mimeType, sizeBytes } = await saveEventImage(eventId, file as File);
  const media = await prisma.media.create({
    data: { eventId, type: "IMAGE", url, mimeType, sizeBytes, status: "APPROVED" },
  });
  await prisma.event.update({ where: { id: eventId }, data: { weddingPortraitSourceId: media.id } });

  revalidatePath(`/dashboard/events/${eventId}/wedding-portrait`);
  redirect(`/dashboard/events/${eventId}/wedding-portrait`);
}

// Generiert EIN Portraet im gewaehlten Stil — Kontingent (WEDDING_PORTRAIT_
// ATTEMPT_QUOTA) wird ueber die Anzahl bisheriger WeddingPortraitAttempt-
// Zeilen pro Event gezaehlt, da jeder Versuch echte OpenAI-Kosten verursacht
// (siehe ai-wedding-portrait.ts). rawUrl (ohne Overlay/Wasserzeichen) wird
// zusaetzlich zur previewUrl gespeichert, damit ein spaeterer bezahlter
// hochaufgeloester Download OHNE erneute Generierung moeglich ist.
export async function generateWeddingPortrait(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const styleKey = String(formData.get("style") ?? "");
  const style = weddingPortraitStyleByKey(styleKey);
  if (!style) redirect(`/dashboard/events/${eventId}/wedding-portrait?error=wedding-portrait-no-style`);

  const attemptCount = await prisma.weddingPortraitAttempt.count({ where: { eventId } });
  if (attemptCount >= WEDDING_PORTRAIT_ATTEMPT_QUOTA) {
    redirect(`/dashboard/events/${eventId}/wedding-portrait?error=wedding-portrait-quota`);
  }

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { weddingPortraitSource: true } });
  if (!event?.weddingPortraitSource) redirect(`/dashboard/events/${eventId}/wedding-portrait?error=wedding-portrait-no-source`);

  const dateLabel = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(event.eventDate);

  let rawResult: Buffer;
  let previewResult: Buffer;
  try {
    const source = await readObject(event.weddingPortraitSource.url);
    rawResult = await generateWeddingPortraitImage(source, event.weddingPortraitSource.mimeType, style);
    previewResult = await composeWeddingPortraitPreview(rawResult, style, event.title, dateLabel);
  } catch (err) {
    if (err instanceof AiBudgetExceededError) redirect(`/dashboard/events/${eventId}/wedding-portrait?error=ai-budget`);
    redirect(`/dashboard/events/${eventId}/wedding-portrait?error=wedding-portrait-failed`);
  }

  const [rawUrl, previewUrl] = await Promise.all([
    putObject(`events/${eventId}/wedding-portrait/${randomUUID()}-raw.png`, rawResult, "image/png"),
    putObject(`events/${eventId}/wedding-portrait/${randomUUID()}-preview.png`, previewResult, "image/png"),
  ]);

  await prisma.weddingPortraitAttempt.create({ data: { eventId, stylePreset: style.key, rawUrl, previewUrl } });

  revalidatePath(`/dashboard/events/${eventId}/wedding-portrait`);
  redirect(`/dashboard/events/${eventId}/wedding-portrait`);
}
