"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analyzePhotos, PHOTO_CURATION_BATCH_LIMIT } from "@/lib/ai-photo-curation";
import { analyzeGuestbookMessages, GUESTBOOK_CURATION_BATCH_LIMIT } from "@/lib/ai-guestbook-curation";
import { generateThankYouMessage } from "@/lib/ai-text";
import { AiBudgetExceededError } from "@/lib/ai-budget-constants";
import { eventHasFeature } from "@/lib/event-features";

// Wie viele der besten Gaeste-Fotos die Dankeskarte automatisch vorschlaegt.
const THANK_YOU_PHOTO_COUNT = 6;

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { order: { include: { package: true } } } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return event;
}

// Galerie und Gaestebuch sind zwei unabhaengige Paket-Features (siehe
// event-features.ts) — bewusst getrennt von requireOwnedEvent() oben, da
// diese Datei beide Bereiche gemeinsam verwaltet.
async function requireEventFeature(eventId: string, featureKey: string) {
  const event = await requireOwnedEvent(eventId);
  if (!eventHasFeature(event, featureKey)) {
    throw new Error(`${featureKey === "gallery" ? "Galerie" : "Gästebuch"} ist in diesem Paket nicht enthalten.`);
  }
  return event;
}

type Status = "APPROVED" | "HIDDEN" | "DELETED";

export async function moderateGalleryItem(eventId: string, itemId: string, status: Status) {
  await requireEventFeature(eventId, "gallery");
  const item = await prisma.galleryItem.findUnique({ where: { id: itemId } });
  if (!item || item.eventId !== eventId) throw new Error("Nicht gefunden.");

  await prisma.galleryItem.update({ where: { id: itemId }, data: { status } });
  revalidatePath(`/dashboard/events/${eventId}/memories`);
  redirect(`/dashboard/events/${eventId}/memories`);
}

export async function moderateGuestbookEntry(eventId: string, entryId: string, status: Status) {
  await requireEventFeature(eventId, "guestbook");
  const entry = await prisma.guestbookEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.eventId !== eventId) throw new Error("Nicht gefunden.");

  await prisma.guestbookEntry.update({ where: { id: entryId }, data: { status } });
  revalidatePath(`/dashboard/events/${eventId}/memories`);
  redirect(`/dashboard/events/${eventId}/memories`);
}

export async function analyzeGalleryPhotos(eventId: string) {
  await requireEventFeature(eventId, "gallery");

  const pending = await prisma.galleryItem.findMany({
    where: { eventId, status: "PENDING" },
    include: { media: true },
    orderBy: { createdAt: "asc" },
    take: PHOTO_CURATION_BATCH_LIMIT,
  });
  // Videos ueberspringen — image_url-Analyse ist fuer Standbilder gedacht.
  const photos = pending.filter((item) => item.media.type === "IMAGE").map((item) => ({ id: item.mediaId, url: item.media.url }));

  if (photos.length > 0) {
    let results;
    try {
      results = await analyzePhotos(photos);
    } catch {
      redirect(`/dashboard/events/${eventId}/memories?error=photo-curation-failed`);
    }

    await prisma.$transaction(
      results
        .filter((r) => photos.some((p) => p.id === r.id))
        .map((r) => prisma.media.update({ where: { id: r.id }, data: { aiVerdict: r.verdict, aiVerdictReason: r.reason } }))
    );
  }

  revalidatePath(`/dashboard/events/${eventId}/memories`);
  redirect(`/dashboard/events/${eventId}/memories`);
}

export async function analyzeGuestbookEntries(eventId: string) {
  await requireEventFeature(eventId, "guestbook");

  const pending = await prisma.guestbookEntry.findMany({
    where: { eventId, status: "PENDING", message: { not: null } },
    orderBy: { createdAt: "asc" },
    take: GUESTBOOK_CURATION_BATCH_LIMIT,
  });
  const entries = pending.filter((e) => e.message).map((e) => ({ id: e.id, message: e.message! }));

  if (entries.length > 0) {
    let results;
    try {
      results = await analyzeGuestbookMessages(entries);
    } catch {
      redirect(`/dashboard/events/${eventId}/memories?error=guestbook-curation-failed`);
    }

    await prisma.$transaction(
      results
        .filter((r) => entries.some((e) => e.id === r.id))
        .map((r) => prisma.guestbookEntry.update({ where: { id: r.id }, data: { aiVerdict: r.verdict, aiVerdictReason: r.reason } }))
    );
  }

  revalidatePath(`/dashboard/events/${eventId}/memories`);
  redirect(`/dashboard/events/${eventId}/memories`);
}

// Roadmap-Punkt 6: waehlt automatisch die besten freigegebenen Gaeste-Fotos
// aus (baut auf aiVerdict === "empfehlung" auf, siehe analyzeGalleryPhotos()
// oben/ai-photo-curation.ts — KEINE neue Kuration, nur die bestehende
// wiederverwendet) und generiert dazu einen Dankestext. Schreibt beides
// direkt in die bestehenden Dankeskarte-Felder (thankYouPhotoIds,
// EventModule.config.message fuer "thank-you-card" — gleiche Stelle wie
// inline-text/route.ts::MODULE_CONFIG_FIELDS), kein separater "Übernehmen"-
// Schritt (einmaliger Ein-Klick-Vorschlag, nicht mehrere Varianten zum
// Vergleichen wie beim Text-Assistenten).
export async function suggestThankYouCard(eventId: string) {
  const event = await requireEventFeature(eventId, "gallery");

  const recommended = await prisma.galleryItem.findMany({
    where: { eventId, status: "APPROVED", media: { type: "IMAGE", aiVerdict: "empfehlung" } },
    include: { media: true },
    orderBy: { createdAt: "desc" },
    take: THANK_YOU_PHOTO_COUNT,
  });
  // Fallback, falls (noch) keine KI-Kuration gelaufen ist oder zu wenige
  // "empfehlung"-Fotos vorliegen — sonst waere die Dankeskarte fuer diese
  // Events ein toter Vorschlag ohne Fotos.
  let photoItems = recommended;
  if (photoItems.length < THANK_YOU_PHOTO_COUNT) {
    const fallback = await prisma.galleryItem.findMany({
      where: { eventId, status: "APPROVED", media: { type: "IMAGE" } },
      include: { media: true },
      orderBy: { createdAt: "desc" },
      take: THANK_YOU_PHOTO_COUNT,
    });
    const seen = new Set(photoItems.map((i) => i.mediaId));
    photoItems = [...photoItems, ...fallback.filter((i) => !seen.has(i.mediaId))].slice(0, THANK_YOU_PHOTO_COUNT);
  }

  let thankYouMessage: string;
  try {
    thankYouMessage = await generateThankYouMessage(event.title);
  } catch (err) {
    if (err instanceof AiBudgetExceededError) redirect(`/dashboard/events/${eventId}/memories?error=ai-budget`);
    redirect(`/dashboard/events/${eventId}/memories?error=thank-you-failed`);
  }

  const mod = await prisma.module.findUnique({ where: { key: "thank-you-card" } });
  if (mod) {
    const existing = await prisma.eventModule.findUnique({ where: { eventId_moduleId: { eventId, moduleId: mod.id } } });
    const config = existing?.config ? JSON.parse(existing.config) : {};
    config.message = thankYouMessage;
    await prisma.eventModule.upsert({
      where: { eventId_moduleId: { eventId, moduleId: mod.id } },
      update: { config: JSON.stringify(config) },
      create: { eventId, moduleId: mod.id, enabled: true, config: JSON.stringify(config) },
    });
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { thankYouPhotoIds: photoItems.length > 0 ? JSON.stringify(photoItems.map((i) => i.mediaId)) : null },
  });

  revalidatePath(`/dashboard/events/${eventId}/memories`);
  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/e/${event.slug}`);
  redirect(`/dashboard/events/${eventId}/memories?thankYouSuggested=1`);
}
