import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, string> = {
  DRAFT: "Entwurf",
  PUBLISHED: "Veröffentlicht",
  ARCHIVED: "Archiviert",
};

export default async function DashboardPage() {
  const session = await auth();
  const events = await prisma.event.findMany({
    where: { ownerId: session!.user.id },
    include: { eventType: true, template: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, color: "var(--ink)" }}>
          Meine Events
        </h1>
        <Link href="/dashboard/events/new" className="btn btn-primary">
          + Neues Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--line)",
            padding: "48px 32px",
            textAlign: "center",
            color: "var(--ink-soft)",
          }}
        >
          <p style={{ fontSize: 14, marginBottom: 18 }}>Du hast noch kein Event erstellt.</p>
          <Link href="/dashboard/events/new" className="btn btn-primary">
            Erstes Event anlegen
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/dashboard/events/${e.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid var(--line)",
                background: "var(--ivory-2)",
                padding: "18px 22px",
                textDecoration: "none",
                color: "var(--ink)",
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>{e.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>
                  {e.eventType.name} · {e.template.name} ·{" "}
                  {new Intl.DateTimeFormat("de-DE").format(e.eventDate)}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--terracotta-dark)" }}>
                {statusLabel[e.status] ?? e.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
