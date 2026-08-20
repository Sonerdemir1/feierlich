"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
