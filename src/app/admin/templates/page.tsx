import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TemplatePreview } from "@/components/marketing/TemplatePreview";

const statusLabel: Record<string, string> = { DRAFT: "Entwurf", ACTIVE: "Aktiv", ARCHIVED: "Archiviert" };
const statusColor: Record<string, string> = { DRAFT: "#8A7F6E", ACTIVE: "#5B7A4E", ARCHIVED: "#B2543A" };

export default async function AdminTemplatesPage() {
  const templates = await prisma.template.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: { _count: { select: { events: true } } },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)" }}>
          Templates ({templates.length})
        </h1>
        <Link href="/admin/templates/new" className="btn btn-primary">
          + Neues Template
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {templates.map((t) => (
          <Link key={t.id} href={`/admin/templates/${t.id}/edit`} className="tpl" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
            <TemplatePreview layoutKey={t.layoutKey} />
            <div className="tpl-label" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <span>{t.name}</span>
              <span style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>{t.category}</span>
              <span style={{ fontSize: 10.5, color: statusColor[t.status], fontWeight: 700 }}>
                {statusLabel[t.status]} · {t._count.events} Events
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
