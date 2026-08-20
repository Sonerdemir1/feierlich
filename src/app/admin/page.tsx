import { prisma } from "@/lib/prisma";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid var(--line)", background: "var(--ivory-2)", padding: "20px 22px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--ink-faint)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, marginTop: 8, color: "var(--ink)" }}>{value}</div>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const [customers, events, publishedEvents, pendingMedia, templates] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.event.count(),
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.galleryItem.count({ where: { status: "PENDING" } }).then(async (g) => g + (await prisma.guestbookEntry.count({ where: { status: "PENDING" } }))),
    prisma.template.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, color: "var(--ink)", marginBottom: 28 }}>
        Übersicht
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <Tile label="Kunden" value={String(customers)} />
        <Tile label="Events gesamt" value={String(events)} />
        <Tile label="Veröffentlicht" value={String(publishedEvents)} />
        <Tile label="Aktive Templates" value={String(templates)} />
        <Tile label="Wartet auf Moderation" value={String(pendingMedia)} />
      </div>
    </div>
  );
}
