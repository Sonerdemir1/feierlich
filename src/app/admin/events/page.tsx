import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, string> = { DRAFT: "Entwurf", PUBLISHED: "Veröffentlicht", ARCHIVED: "Archiviert" };
const statusColor: Record<string, string> = { DRAFT: "#8A7F6E", PUBLISHED: "#5B7A4E", ARCHIVED: "#B2543A" };

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    include: { owner: true, eventType: true, template: true, guests: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", marginBottom: 24 }}>
        Events ({events.length})
      </h1>
      {events.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>Noch keine Events erstellt.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                {["Titel", "Kunde", "Typ", "Template", "Gäste", "Aufrufe", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 8px", color: "var(--ink-faint)", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 8px", fontWeight: 600 }}>{e.title}</td>
                  <td style={{ padding: "10px 8px", color: "var(--ink-soft)" }}>{e.owner.email}</td>
                  <td style={{ padding: "10px 8px", color: "var(--ink-soft)" }}>{e.eventType.name}</td>
                  <td style={{ padding: "10px 8px", color: "var(--ink-soft)" }}>{e.template.name}</td>
                  <td style={{ padding: "10px 8px" }}>{e.guests.length}</td>
                  <td style={{ padding: "10px 8px" }}>{e.viewCount}</td>
                  <td style={{ padding: "10px 8px" }}>
                    <span style={{ color: statusColor[e.status], fontWeight: 600, fontSize: 12 }}>{statusLabel[e.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
