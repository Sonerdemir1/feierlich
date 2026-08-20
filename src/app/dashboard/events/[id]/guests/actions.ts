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

export async function addGuest(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const firstName = String(formData.get("firstName") ?? "").trim();
  if (!firstName) throw new Error("Name ist erforderlich.");

  await prisma.guest.create({
    data: {
      eventId,
      firstName,
      lastName: String(formData.get("lastName") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      invitedCount: Number(formData.get("invitedCount") ?? 1) || 1,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  revalidatePath(`/dashboard/events/${eventId}/guests`);
  redirect(`/dashboard/events/${eventId}/guests`);
}

export async function updateGuest(eventId: string, guestId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const guest = await prisma.guest.findUnique({ where: { id: guestId }, include: { rsvp: true } });
  if (!guest || guest.eventId !== eventId) throw new Error("Gast nicht gefunden.");

  const firstName = String(formData.get("firstName") ?? "").trim();
  if (!firstName) throw new Error("Name ist erforderlich.");

  await prisma.guest.update({
    where: { id: guestId },
    data: {
      firstName,
      lastName: String(formData.get("lastName") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      invitedCount: Number(formData.get("invitedCount") ?? 1) || 1,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  const status = String(formData.get("status") ?? "PENDING");
  const menuChoice = String(formData.get("menuChoice") ?? "").trim() || null;
  if (guest.rsvp) {
    await prisma.rSVP.update({
      where: { id: guest.rsvp.id },
      data: { status: status as "PENDING" | "YES" | "NO", menuChoice },
    });
  } else if (status !== "PENDING" || menuChoice) {
    await prisma.rSVP.create({
      data: { guestId, status: status as "PENDING" | "YES" | "NO", menuChoice, respondedAt: new Date() },
    });
  }

  revalidatePath(`/dashboard/events/${eventId}/guests`);
  redirect(`/dashboard/events/${eventId}/guests`);
}

export async function deleteGuest(eventId: string, guestId: string) {
  await requireOwnedEvent(eventId);
  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest || guest.eventId !== eventId) throw new Error("Gast nicht gefunden.");

  await prisma.guest.delete({ where: { id: guestId } });
  revalidatePath(`/dashboard/events/${eventId}/guests`);
  redirect(`/dashboard/events/${eventId}/guests`);
}
