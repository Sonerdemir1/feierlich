import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, string> = {
  DRAFT: "Entwurf",
  PUBLISHED: "Veröffentlicht",
  ARCHIVED: "Archiviert",
};

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ border: "1px solid var(--line)", background: "var(--ivory-2)", padding: "18px 20px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--ink-faint)", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 6, color: "var(--ink)" }}>{value}</div>
      {note && <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 4 }}>{note}</div>}
    </div>
  );
}

export default async function EventDetailPage({ params }: PageProps<"/dashboard/events/[id]">) {
  const { id } = await params;
  const session = await auth();

  const event = await prisma.event.findUnique({
    where: { id },
    include: { eventType: true, template: true, guests: true },
  });

  if (!event || event.ownerId !== session!.user.id) {
    notFound();
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--terracotta-dark)", marginBottom: 8 }}>
        {event.eventType.name} · {event.template.name}
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 32, color: "var(--ink)", marginBottom: 6 }}>
        {event.title}
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 32 }}>
        {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(event.eventDate)} · Status:{" "}
        {statusLabel[event.status] ?? event.status}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 36 }}>
        <Tile label="Gäste" value={String(event.guests.length)} />
        <Tile label="Zusagen" value="—" note="Phase 7" />
        <Tile label="Aufrufe" value="—" note="Phase 6" />
        <Tile label="QR-Codes" value="—" note="Phase 8" />
      </div>

      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Öffentliche Event-Seite</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>digitaleventstudio.de/e/{event.slug}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 6 }}>
          Die öffentliche Seite selbst kommt in Phase 6 (Event-Webseite).
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {[
          ["Gästeliste", "Phase 7"],
          ["Sitzplan", "Phase 9"],
          ["Gästebuch & Galerie", "Phase 10"],
          ["Einstellungen & Module", "Phase 5/6"],
        ].map(([label, phase]) => (
          <div
            key={label}
            style={{
              border: "1px dashed var(--line)",
              padding: "16px 18px",
              fontSize: 13,
              color: "var(--ink-faint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{label}</span>
            <span style={{ fontSize: 11 }}>{phase}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
