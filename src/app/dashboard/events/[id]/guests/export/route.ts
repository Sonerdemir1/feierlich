import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function csvCell(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return new Response("Nicht angemeldet.", { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) {
    return new Response("Nicht gefunden.", { status: 404 });
  }

  const guests = await prisma.guest.findMany({
    where: { eventId: id },
    include: { rsvp: true },
    orderBy: { firstName: "asc" },
  });

  const statusLabel: Record<string, string> = { YES: "Zusage", NO: "Absage", PENDING: "Offen" };
  const header = ["Vorname", "Nachname", "E-Mail", "Telefon", "Status", "Personen", "Menü", "Notizen"];
  const rows = guests.map((g) => [
    g.firstName,
    g.lastName ?? "",
    g.email ?? "",
    g.phone ?? "",
    statusLabel[g.rsvp?.status ?? "PENDING"],
    g.rsvp?.attendingCount ?? g.invitedCount,
    g.rsvp?.menuChoice ?? "",
    g.notes ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const bom = "﻿"; // sorgt fuer korrekte Umlaute beim Oeffnen in Excel

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gaesteliste-${event.slug}.csv"`,
    },
  });
}
