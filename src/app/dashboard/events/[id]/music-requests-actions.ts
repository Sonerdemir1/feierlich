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

export async function deleteMusicRequest(eventId: string, requestId: string) {
  await requireOwnedEvent(eventId);
  const request = await prisma.musicRequest.findUnique({ where: { id: requestId } });
  if (!request || request.eventId !== eventId) throw new Error("Eintrag nicht gefunden.");

  await prisma.musicRequest.delete({ where: { id: requestId } });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}
