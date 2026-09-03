"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { validateMediaFile, saveEventMedia, mediaKindFromMime } from "@/lib/uploads";
import { aiTranslateConfigured, detectAndTranslate } from "@/lib/ai-translate";

export async function submitRsvp(eventId: string, slug: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!name) redirect(`/e/${slug}?rsvp=error`);

  // Drei Zustaende statt nur Ja/Nein — "Noch unsicher" nutzt den bereits
  // vorhandenen RsvpStatus.PENDING (bisher nur als impliziter Default vor
  // jeder Antwort genutzt, jetzt auch aktiv waehlbar).
  const attendingRaw = String(formData.get("attending") ?? "yes");
  const status = attendingRaw === "no" ? "NO" : attendingRaw === "unsure" ? "PENDING" : "YES";
  const countRaw = Number(formData.get("count") ?? 1);
  const count = Number.isFinite(countRaw) && countRaw > 0 ? Math.min(countRaw, 20) : 1;
  const message = String(formData.get("message") ?? "").trim().slice(0, 1000) || null;

  // Nie den rohen String uebernehmen — nur echte Hauptgang-Namen dieses
  // Events akzeptieren, sonst koennte ein manipuliertes Formular beliebigen
  // Text in menuChoice schreiben.
  const menuChoiceRaw = String(formData.get("menuChoice") ?? "").trim();
  const menuChoice = menuChoiceRaw
    ? (await prisma.menuItem.findFirst({ where: { eventId, course: "MAIN", name: menuChoiceRaw } }))?.name ?? null
    : null;

  const guest = await prisma.guest.create({
    data: { eventId, firstName: name, invitedCount: count },
  });
  await prisma.rSVP.create({
    data: {
      guestId: guest.id,
      status,
      attendingCount: status === "YES" ? count : null,
      message,
      menuChoice,
      respondedAt: new Date(),
    },
  });

  revalidatePath(`/e/${slug}`);
  redirect(`/e/${slug}?rsvp=success`);
}

export async function findSeat(eventId: string, slug: string, formData: FormData) {
  const name = String(formData.get("seatName") ?? "").trim().slice(0, 80);
  if (!name) redirect(`/e/${slug}#sitzplatz`);

  const guest = await prisma.guest.findFirst({
    where: { eventId, firstName: { contains: name } },
    include: { seat: { include: { table: true } } },
  });

  const result = guest?.seat ? encodeURIComponent(guest.seat.table.name) : "notfound";
  redirect(`/e/${slug}?seat=${result}#sitzplatz`);
}

export async function uploadGalleryPhoto(eventId: string, slug: string, formData: FormData) {
  const file = formData.get("file");
  const error = validateMediaFile(file);
  if (error) redirect(`/e/${slug}?galleryError=${error}#galerie`);

  const { url, mimeType, sizeBytes } = await saveEventMedia(eventId, file as File);
  const uploaderName = String(formData.get("uploaderName") ?? "").trim().slice(0, 80) || null;

  // tableId kommt aus einem versteckten Formularfeld — im Browser
  // manipulierbar, daher hier erneut gegen das eigene Event geprueft statt
  // blind uebernommen (sonst liesse sich fremden Events eine tableId
  // unterschieben).
  const tableIdRaw = String(formData.get("tableId") ?? "").trim();
  const table = tableIdRaw ? await prisma.table.findFirst({ where: { id: tableIdRaw, eventId } }) : null;

  const media = await prisma.media.create({
    data: { eventId, tableId: table?.id, type: mediaKindFromMime(mimeType), url, mimeType, sizeBytes, uploaderName, status: "PENDING" },
  });
  await prisma.galleryItem.create({ data: { eventId, mediaId: media.id, status: "PENDING" } });

  revalidatePath(`/e/${slug}`);
  redirect(`/e/${slug}?gallery=success#galerie`);
}

// Anders als die Actions oben: werden aus einer interaktiven Client-
// Komponente (PhotoTagger) per useTransition aufgerufen, nicht aus einem
// <form action={...}> ohne JS. Ein redirect() wuerde dort das optimistische
// Update im Client-State durch einen vollen Reload wieder ueberschreiben —
// daher hier bewusst ein einfaches Ergebnisobjekt statt redirect()/throw().
export type PhotoTagResult = { success: true } | { success: false; error: string };

export async function addPhotoTag(mediaId: string, guestId: string): Promise<PhotoTagResult> {
  const media = await prisma.media.findUnique({ where: { id: mediaId }, include: { event: true } });
  if (!media || !media.event) return { success: false, error: "Foto nicht gefunden." };
  const { slug } = media.event;

  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest || guest.eventId !== media.eventId) {
    return { success: false, error: "Gast gehört nicht zu diesem Event." };
  }

  try {
    await prisma.photoTag.create({ data: { mediaId, guestId } });
  } catch {
    return { success: false, error: "Markierung konnte nicht gespeichert werden." };
  }

  revalidatePath(`/e/${slug}#galerie`);
  return { success: true };
}

export async function removePhotoTag(mediaId: string, guestId: string): Promise<PhotoTagResult> {
  const media = await prisma.media.findUnique({ where: { id: mediaId }, include: { event: true } });
  if (!media || !media.event) return { success: false, error: "Foto nicht gefunden." };
  const { slug } = media.event;

  try {
    await prisma.photoTag.delete({ where: { mediaId_guestId: { mediaId, guestId } } });
  } catch {
    return { success: false, error: "Markierung konnte nicht entfernt werden." };
  }

  revalidatePath(`/e/${slug}#galerie`);
  return { success: true };
}

// Gaestelisten sind ueberschaubar (typischerweise unter 300 Personen) —
// eine einfache sortierte Liste reicht, das Filtern nach Tipp-Eingabe
// passiert clientseitig in der Tagging-Komponente statt per serverseitiger
// Suche mit Debounce.
export async function getEventGuestsForTagging(eventId: string) {
  return prisma.guest.findMany({
    where: { eventId },
    select: { id: true, firstName: true, groupLabel: true },
    orderBy: { firstName: "asc" },
  });
}

export async function submitGuestbookEntry(eventId: string, slug: string, formData: FormData) {
  const authorName = String(formData.get("authorName") ?? "").trim().slice(0, 80);
  const message = String(formData.get("message") ?? "").trim().slice(0, 1000) || null;
  if (!authorName) redirect(`/e/${slug}?guestbookError=no-name#gaestebuch`);

  const file = formData.get("file");
  let mediaId: string | undefined;
  if (file instanceof File && file.size > 0) {
    const error = validateMediaFile(file);
    if (error) redirect(`/e/${slug}?guestbookError=${error}#gaestebuch`);
    const { url, mimeType, sizeBytes } = await saveEventMedia(eventId, file);
    const media = await prisma.media.create({
      data: { eventId, type: mediaKindFromMime(mimeType), url, mimeType, sizeBytes, uploaderName: authorName, status: "PENDING" },
    });
    mediaId = media.id;
  }

  // Best-effort: Sprache erkennen + ins Deutsche uebersetzen, damit alle
  // Familienmitglieder (tuerkisch-/kurdisch-/deutschsprachig) mitlesen
  // koennen. Scheitert die Uebersetzung (oder ist kein Key konfiguriert),
  // wird die Einreichung trotzdem ganz normal gespeichert — nie blockieren.
  let detectedLanguage: string | null = null;
  let translatedMessage: string | null = null;
  if (message && aiTranslateConfigured) {
    try {
      const translation = await detectAndTranslate(message);
      detectedLanguage = translation.detectedLanguage;
      translatedMessage = translation.translatedText;
    } catch {
      // stumm ignorieren — Original-Nachricht wird trotzdem gespeichert
    }
  }

  await prisma.guestbookEntry.create({
    data: { eventId, authorName, message, mediaId, detectedLanguage, translatedMessage, status: "PENDING" },
  });

  revalidatePath(`/e/${slug}`);
  redirect(`/e/${slug}?guestbook=success#gaestebuch`);
}

// Anders als Gaestebuch/Galerie werden Musikwuensche nie oeffentlich an
// andere Gaeste zurueckgegeben (siehe Sektion in page.tsx) — deshalb kein
// ModerationStatus noetig, Loeschen im Dashboard ist der einzige (und
// ausreichende) Hebel, da nur der Organisator die Liste je zu sehen bekommt.
export async function submitMusicRequest(eventId: string, slug: string, formData: FormData) {
  const guestName = String(formData.get("guestName") ?? "").trim().slice(0, 80);
  const song = String(formData.get("song") ?? "").trim().slice(0, 160);
  const artist = String(formData.get("artist") ?? "").trim().slice(0, 160);
  const message = String(formData.get("message") ?? "").trim().slice(0, 500) || null;

  if (!guestName) redirect(`/e/${slug}?musicError=no-name#musikwuensche`);
  if (!song || !artist) redirect(`/e/${slug}?musicError=no-song#musikwuensche`);

  await prisma.musicRequest.create({ data: { eventId, guestName, song, artist, message } });

  revalidatePath(`/e/${slug}`);
  redirect(`/e/${slug}?music=success#musikwuensche`);
}
