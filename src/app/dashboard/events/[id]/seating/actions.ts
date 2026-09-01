"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  suggestSeatingArrangement,
  validateSeatingAssignment,
  type SeatingGuestInput,
  type SeatingTableInput,
  type SeatingAssignment,
} from "@/lib/ai-seating";

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

// Laedt den aktuellen Stand (nicht zugewiesene Gaeste + freie Tisch-
// Plaetze) in dem schlanken Format, das sowohl die KI-Anfrage als auch
// die serverseitige Validierung erwartet — von suggestSeating() und
// applySeatingSuggestion() gemeinsam genutzt, damit beide garantiert
// gegen denselben aktuellen DB-Stand pruefen.
async function loadSeatingInputs(eventId: string): Promise<{ guests: SeatingGuestInput[]; tables: SeatingTableInput[] }> {
  const [unseatedGuests, tables] = await Promise.all([
    prisma.guest.findMany({ where: { eventId, seat: null }, orderBy: { firstName: "asc" } }),
    prisma.table.findMany({ where: { eventId }, include: { seats: true } }),
  ]);

  return {
    guests: unseatedGuests.map((g) => ({
      id: g.id,
      name: `${g.firstName} ${g.lastName ?? ""}`.trim(),
      groupLabel: g.groupLabel,
    })),
    tables: tables.map((t) => ({ id: t.id, name: t.name, availableSeats: t.capacity - t.seats.length })),
  };
}

export async function suggestSeating(eventId: string) {
  await requireOwnedEvent(eventId);

  const { guests, tables } = await loadSeatingInputs(eventId);
  if (guests.length === 0) redirect(`/dashboard/events/${eventId}/seating?error=seating-ai-no-guests`);
  if (tables.length === 0) redirect(`/dashboard/events/${eventId}/seating?error=seating-ai-no-tables`);

  let assignment: SeatingAssignment[];
  try {
    assignment = await suggestSeatingArrangement(guests, tables);
  } catch {
    redirect(`/dashboard/events/${eventId}/seating?error=seating-ai-failed`);
  }

  const validation = validateSeatingAssignment(assignment, guests, tables);
  if (!validation.valid) redirect(`/dashboard/events/${eventId}/seating?error=seating-ai-invalid`);

  await prisma.seatingSuggestion.upsert({
    where: { eventId },
    update: { dataJson: JSON.stringify(assignment) },
    create: { eventId, dataJson: JSON.stringify(assignment) },
  });

  revalidatePath(`/dashboard/events/${eventId}/seating`);
  redirect(`/dashboard/events/${eventId}/seating`);
}

export async function applySeatingSuggestion(eventId: string) {
  await requireOwnedEvent(eventId);

  const suggestion = await prisma.seatingSuggestion.findUnique({ where: { eventId } });
  if (!suggestion) redirect(`/dashboard/events/${eventId}/seating?error=seating-ai-expired`);

  const assignment = JSON.parse(suggestion.dataJson) as SeatingAssignment[];

  // Erneut gegen den JETZIGEN Stand pruefen — zwischen Vorschlag und
  // Uebernahme koennte sich manuell etwas geaendert haben (Tisch geloescht,
  // Gast anderweitig zugewiesen, Kapazitaet reduziert).
  const { guests, tables } = await loadSeatingInputs(eventId);
  const validation = validateSeatingAssignment(assignment, guests, tables);
  if (!validation.valid) {
    await prisma.seatingSuggestion.delete({ where: { eventId } });
    redirect(`/dashboard/events/${eventId}/seating?error=seating-ai-expired`);
  }

  await prisma.$transaction(async (tx) => {
    for (const entry of assignment) {
      const existingSeats = await tx.seat.findMany({ where: { tableId: entry.tableId } });
      const usedNumbers = new Set(existingSeats.map((s) => s.seatNumber));
      for (const guestId of entry.guestIds) {
        let seatNumber = 1;
        while (usedNumbers.has(seatNumber)) seatNumber += 1;
        usedNumbers.add(seatNumber);
        await tx.seat.create({ data: { tableId: entry.tableId, guestId, seatNumber } });
      }
    }
    await tx.seatingSuggestion.delete({ where: { eventId } });
  });

  revalidatePath(`/dashboard/events/${eventId}/seating`);
  redirect(`/dashboard/events/${eventId}/seating`);
}

export async function discardSeatingSuggestion(eventId: string) {
  await requireOwnedEvent(eventId);
  await prisma.seatingSuggestion.deleteMany({ where: { eventId } });
  revalidatePath(`/dashboard/events/${eventId}/seating`);
  redirect(`/dashboard/events/${eventId}/seating`);
}
