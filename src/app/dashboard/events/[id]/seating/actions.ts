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

export async function createTable(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);
  const name = String(formData.get("name") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 8) || 8;
  if (!name) throw new Error("Tischname ist erforderlich.");

  await prisma.table.create({ data: { eventId, name, capacity } });
  revalidatePath(`/dashboard/events/${eventId}/seating`);
  redirect(`/dashboard/events/${eventId}/seating`);
}

export async function deleteTable(eventId: string, tableId: string) {
  await requireOwnedEvent(eventId);
  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || table.eventId !== eventId) throw new Error("Tisch nicht gefunden.");

  await prisma.table.delete({ where: { id: tableId } });
  revalidatePath(`/dashboard/events/${eventId}/seating`);
  redirect(`/dashboard/events/${eventId}/seating`);
}

export async function assignGuestToTable(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);
  const guestId = String(formData.get("guestId") ?? "");
  const tableId = String(formData.get("tableId") ?? "");
  if (!guestId) throw new Error("Gast fehlt.");

  const guest = await prisma.guest.findUnique({ where: { id: guestId }, include: { seat: true } });
  if (!guest || guest.eventId !== eventId) throw new Error("Gast nicht gefunden.");

  // vorhandenen Platz freigeben, egal ob neu zugewiesen oder entfernt
  if (guest.seat) {
    await prisma.seat.delete({ where: { id: guest.seat.id } });
  }

  if (tableId) {
    const table = await prisma.table.findUnique({ where: { id: tableId }, include: { seats: true } });
    if (!table || table.eventId !== eventId) throw new Error("Tisch nicht gefunden.");
    if (table.seats.length >= table.capacity) {
      redirect(`/dashboard/events/${eventId}/seating?error=full`);
    }
    const usedNumbers = new Set(table.seats.map((s) => s.seatNumber));
    let seatNumber = 1;
    while (usedNumbers.has(seatNumber)) seatNumber += 1;

    await prisma.seat.create({ data: { tableId, guestId, seatNumber } });
  }

  revalidatePath(`/dashboard/events/${eventId}/seating`);
  redirect(`/dashboard/events/${eventId}/seating`);
}
