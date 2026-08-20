import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addGuest } from "../actions";

export default async function NewGuestPage({ params }: PageProps<"/dashboard/events/[id]/guests/new">) {
  const { id } = await params;
  const session = await auth();
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session!.user.id) notFound();

  return (
    <div>
      <Link href={`/dashboard/events/${id}/guests`} style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zur Gästeliste
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, color: "var(--ink)", margin: "14px 0 24px" }}>
        Gast hinzufügen
      </h1>

      <form action={addGuest.bind(null, id)} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 440 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input name="firstName" placeholder="Vorname" required style={fieldStyle} />
          <input name="lastName" placeholder="Nachname (optional)" style={fieldStyle} />
        </div>
        <input name="email" type="email" placeholder="E-Mail (optional)" style={fieldStyle} />
        <input name="phone" placeholder="Telefon (optional)" style={fieldStyle} />
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
          Anzahl Personen
          <input name="invitedCount" type="number" min={1} defaultValue={1} style={fieldStyle} />
        </label>
        <textarea name="notes" placeholder="Notizen (optional)" rows={3} style={{ ...fieldStyle, fontFamily: "inherit" }} />
        <button type="submit" className="btn btn-primary" style={{ padding: 14, justifyContent: "center" }}>
          Gast speichern
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
