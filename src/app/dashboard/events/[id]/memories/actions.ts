"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analyzePhotos, PHOTO_CURATION_BATCH_LIMIT } from "@/lib/ai-photo-curation";
import { analyzeGuestbookMessages, GUESTBOOK_CURATION_BATCH_LIMIT } from "@/lib/ai-guestbook-curation";

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return event;
}

type Status = "APPROVED" | "HIDDEN" | "DELETED";

export async function moderateGalleryItem(eventId: string, itemId: string, status: Status) {
  await requireOwnedEvent(eventId);
  const item = await prisma.galleryItem.findUnique({ where: { id: itemId } });
  if (!item || item.eventId !== eventId) throw new Error("Nicht gefunden.");

  await prisma.galleryItem.update({ where: { id: itemId }, data: { status } });
  revalidatePath(`/dashboard/events/${eventId}/memories`);
  redirect(`/dashboard/events/${eventId}/memories`);
}

export async function moderateGuestbookEntry(eventId: string, entryId: string, status: Status) {
  await requireOwnedEvent(eventId);
  const entry = await prisma.guestbookEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.eventId !== eventId) throw new Error("Nicht gefunden.");

  await prisma.guestbookEntry.update({ where: { id: entryId }, data: { status } });
  revalidatePath(`/dashboard/events/${eventId}/memories`);
  redirect(`/dashboard/events/${eventId}/memories`);
}

export async function analyzeGalleryPhotos(eventId: string) {
  await requireOwnedEvent(eventId);

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
  await requireOwnedEvent(eventId);

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
