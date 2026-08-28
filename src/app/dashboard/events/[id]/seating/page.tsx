import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTable, deleteTable, assignGuestToTable } from "./actions";

export default async function SeatingPage({ params, searchParams }: PageProps<"/dashboard/events/[id]/seating">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session!.user.id) notFound();

  const [tables, guests] = await Promise.all([
    prisma.table.findMany({ where: { eventId: id }, include: { seats: true }, orderBy: { name: "asc" } }),
    prisma.guest.findMany({ where: { eventId: id }, include: { seat: { include: { table: true } } }, orderBy: { firstName: "asc" } }),
  ]);

  const errorKey = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zum Event
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", margin: "14px 0 6px" }}>
        Sitzplan — {event.title}
      </h1>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 28 }}>
        {tables.length} Tische · {guests.filter((g) => g.seat).length} von {guests.length} Gästen zugewiesen
      </p>

      {errorKey === "full" && (
        <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Dieser Tisch ist bereits voll.
        </div>
      )}

      {/* Tische */}
      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 14 }}>Tische</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          {tables.map((t) => (
            <div
              key={t.id}
              style={{
                border: "1px solid var(--line)",
                background: "var(--ivory-2)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
              }}
            >
              <span style={{ fontWeight: 600 }}>{t.name}</span>
              <span style={{ color: "var(--ink-faint)", fontSize: 11.5 }}>
                {t.seats.length}/{t.capacity}
              </span>
              <a
                href={`/dashboard/events/${id}/qr/table/${t.id}?format=png&download=1`}
                style={{ fontSize: 11, color: "var(--terracotta-dark)" }}
              >
                QR-Code
              </a>
              <form action={deleteTable.bind(null, id, t.id)}>
                <button type="submit" style={{ fontSize: 11, color: "#B2543A", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Entfernen
                </button>
              </form>
            </div>
          ))}
        </div>
        <form action={createTable.bind(null, id)} style={{ display: "flex", gap: 10 }}>
          <input name="name" placeholder="z. B. Tisch 5" required style={{ padding: "10px 12px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13, flex: 1, maxWidth: 220 }} />
          <input name="capacity" type="number" min={1} defaultValue={8} style={{ padding: "10px 12px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13, width: 90 }} />
          <button type="submit" className="btn btn-ghost" style={{ padding: "10px 18px", fontSize: 12.5 }}>
            + Tisch hinzufügen
          </button>
        </form>
      </div>

      {/* Gaeste-Zuordnung */}
      <div style={{ border: "1px solid var(--line)", padding: "20px 22px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Gäste zuordnen</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Ein Klick auf einen Tisch weist den Gast zu.
        </div>
        {guests.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Noch keine Gäste. Erst in der <Link href={`/dashboard/events/${id}/guests`}>Gästeliste</Link> hinzufügen.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {guests.map((g) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {g.firstName} {g.lastName ?? ""}
                  <span style={{ fontWeight: 400, color: "var(--ink-faint)", marginLeft: 8, fontSize: 12 }}>
                    {g.seat ? `→ ${g.seat.table.name}` : "nicht zugewiesen"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {tables.map((t) => {
                    const isCurrent = g.seat?.tableId === t.id;
                    return (
                      <form key={t.id} action={assignGuestToTable.bind(null, id)}>
                        <input type="hidden" name="guestId" value={g.id} />
                        <input type="hidden" name="tableId" value={t.id} />
                        <button
                          type="submit"
                          style={{
                            fontSize: 11.5,
                            padding: "6px 10px",
                            border: isCurrent ? "1px solid var(--ink)" : "1px solid var(--line)",
                            background: isCurrent ? "var(--ink)" : "var(--ivory-2)",
                            color: isCurrent ? "var(--ivory)" : "var(--ink-soft)",
                            cursor: "pointer",
                          }}
                        >
                          {t.name}
                        </button>
                      </form>
                    );
                  })}
                  {g.seat && (
                    <form action={assignGuestToTable.bind(null, id)}>
                      <input type="hidden" name="guestId" value={g.id} />
                      <input type="hidden" name="tableId" value="" />
                      <button type="submit" style={{ fontSize: 11.5, padding: "6px 10px", border: "1px solid var(--line)", background: "none", color: "#B2543A", cursor: "pointer" }}>
                        Entfernen
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
