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

// Manueller Nachtrag durch den Organisator selbst (z. B. Gast ohne Handy
// dabei) — gleiches @@unique-Schutzmuster wie confirmCheckIn/
// checkInGuestByName in e/[slug]/actions.ts.
export async function checkInGuest(eventId: string, guestId: string) {
  await requireOwnedEvent(eventId);
  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest || guest.eventId !== eventId) throw new Error("Gast nicht gefunden.");

  await prisma.checkIn.upsert({ where: { guestId }, update: {}, create: { eventId, guestId } });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}
