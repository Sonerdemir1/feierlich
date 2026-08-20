import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateGuest } from "../../actions";

export default async function EditGuestPage({ params }: PageProps<"/dashboard/events/[id]/guests/[guestId]/edit">) {
  const { id, guestId } = await params;
  const session = await auth();
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session!.user.id) notFound();

  const guest = await prisma.guest.findUnique({ where: { id: guestId }, include: { rsvp: true } });
  if (!guest || guest.eventId !== id) notFound();

  return (
    <div>
      <Link href={`/dashboard/events/${id}/guests`} style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zur Gästeliste
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, color: "var(--ink)", margin: "14px 0 24px" }}>
        Gast bearbeiten
      </h1>

      <form action={updateGuest.bind(null, id, guestId)} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 440 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input name="firstName" defaultValue={guest.firstName} placeholder="Vorname" required style={fieldStyle} />
          <input name="lastName" defaultValue={guest.lastName ?? ""} placeholder="Nachname" style={fieldStyle} />
        </div>
        <input name="email" type="email" defaultValue={guest.email ?? ""} placeholder="E-Mail" style={fieldStyle} />
        <input name="phone" defaultValue={guest.phone ?? ""} placeholder="Telefon" style={fieldStyle} />
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
          Anzahl Personen
          <input name="invitedCount" type="number" min={1} defaultValue={guest.invitedCount} style={fieldStyle} />
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, color: "var(--ink-soft)" }}>
          RSVP-Status
          <div style={{ display: "flex", gap: 14 }}>
            {(["PENDING", "YES", "NO"] as const).map((value) => (
              <label key={value} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink)", cursor: "pointer" }}>
                <input type="radio" name="status" value={value} defaultChecked={(guest.rsvp?.status ?? "PENDING") === value} />
                {{ PENDING: "Offen", YES: "Zusage", NO: "Absage" }[value]}
              </label>
            ))}
          </div>
        </div>
        <input name="menuChoice" defaultValue={guest.rsvp?.menuChoice ?? ""} placeholder="Menüwunsch (optional)" style={fieldStyle} />
        <textarea name="notes" defaultValue={guest.notes ?? ""} placeholder="Notizen" rows={3} style={{ ...fieldStyle, fontFamily: "inherit" }} />
        {guest.rsvp?.message && (
          <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>Nachricht vom Gast: &bdquo;{guest.rsvp.message}&ldquo;</div>
        )}
        <button type="submit" className="btn btn-primary" style={{ padding: 14, justifyContent: "center" }}>
          Speichern
        </button>
      </form>
    </div>
  );
}

const fieldStyle: CSSProperties = {
  padding: "12px 14px",
  border: "1px solid var(--line)",
  background: "var(--ivory-2)",
  fontSize: 13.5,
  flex: 1,
};
